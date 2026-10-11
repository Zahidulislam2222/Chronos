"""Read WooCommerce products and prepare durable private social listing drafts."""

import hashlib
import json
import sqlite3
import threading
import uuid
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlsplit

import httpx

from .config import Settings


def canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


class TargetError(Exception):
    """Safe provider error, without payloads or credential values."""


class Engine:
    def __init__(self, settings: Settings, client: httpx.Client | None = None) -> None:
        self.settings = settings
        self.lock = threading.Lock()
        self.client = client or httpx.Client(
            timeout=settings.request_timeout,
            follow_redirects=False,
            trust_env=False,
        )
        settings.database.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(settings.database, check_same_thread=False)
        settings.database.chmod(0o600)
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS batches(id TEXT PRIMARY KEY, count INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS candidates(
                batch TEXT, ordinal INTEGER, data TEXT NOT NULL, result TEXT,
                PRIMARY KEY(batch, ordinal));
            CREATE TABLE IF NOT EXISTS imports(
                sku TEXT PRIMARY KEY, state TEXT NOT NULL, digest TEXT NOT NULL,
                product INTEGER, payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS social_queue(
                sku TEXT PRIMARY KEY, product INTEGER NOT NULL, data TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending_review');
            CREATE TABLE IF NOT EXISTS current_catalog(product INTEGER PRIMARY KEY);
            CREATE TABLE IF NOT EXISTS batch_head(
                singleton INTEGER PRIMARY KEY CHECK(singleton=1), batch TEXT NOT NULL);
        """)
        self.db.commit()

    def close(self) -> None:
        self.db.close()
        self.client.close()

    def accept(self, data: Any) -> dict[str, Any]:
        if not isinstance(data, dict) or set(data) != {"items"}:
            raise ValueError("Expected an object containing only items")
        items = data["items"]
        if not isinstance(items, list) or not 1 <= len(items) <= self.settings.batch_limit:
            raise ValueError("Batch size outside configured limits")
        with self.lock, self.db:
            return self._accept(items)

    def _accept(self, items: list[Any]) -> dict[str, Any]:
        """Caller holds the lock and transaction, including source reconciliation."""
        batch = uuid.uuid4().hex
        self.db.execute("INSERT INTO batches VALUES (?,?)", (batch, len(items)))
        for index, item in enumerate(items):
            self.db.execute(
                "INSERT INTO candidates VALUES (?,?,?,NULL)", (batch, index, canonical(item))
            )
        self.db.execute("INSERT OR REPLACE INTO batch_head VALUES (1,?)", (batch,))
        return {
            "batch_id": batch,
            "items": [{"batch_id": batch, "ordinal": index} for index in range(len(items))],
        }

    def normalize(self, candidate: Any) -> tuple[str, dict[str, Any]]:
        if not isinstance(candidate, dict):
            raise ValueError("Candidate must be an object")
        required = {
            "source_id",
            "product_id",
            "name",
            "availability",
            "price",
            "currency",
            "photos",
        }
        if set(candidate) != required:
            raise ValueError("Candidate fields differ from documented intake schema")
        source = candidate["source_id"]
        if not isinstance(source, str) or not 1 <= len(source) <= 200 or not source.strip():
            raise ValueError("Invalid source ID")
        name = candidate["name"]
        if not isinstance(name, str) or not 1 <= len(name) <= 200 or not name.strip():
            raise ValueError("Invalid product name")
        if candidate["availability"] not in self.settings.available_statuses:
            return "unavailable", {}
        photos = candidate["photos"]
        if not isinstance(photos, list) or len(photos) > self.settings.gallery_limit:
            raise ValueError("Gallery outside configured limits")
        if not photos:
            return "no_photos", {}
        gallery = []
        for photo in photos:
            if not isinstance(photo, str):
                raise ValueError("Each photo must be a URL string")
            try:
                url = urlsplit(photo)
                outside_policy = (
                    url.scheme != "https"
                    or url.hostname not in self.settings.image_hosts
                    or url.username
                    or url.password
                    or url.port not in {None, 443}
                    or url.fragment
                )
            except ValueError:
                raise ValueError("Photo URL is outside the approved image policy") from None
            if outside_policy:
                raise ValueError("Photo URL is outside the approved image policy")
            if photo not in gallery:
                gallery.append(photo)
        if candidate["currency"] != self.settings.currency:
            raise ValueError("Currency differs from configured store currency")
        raw_price = candidate["price"]
        if not isinstance(raw_price, str):
            raise ValueError("Price must be a decimal string")
        try:
            price = Decimal(raw_price)
            if not price.is_finite() or price < 0 or price != price.quantize(Decimal("0.01")):
                raise ValueError("Invalid price or precision")
        except InvalidOperation as exc:
            raise ValueError("Invalid price") from exc
        identity = self.settings.source_namespace + ":" + source
        sku = "chronos-" + hashlib.sha256(identity.encode()).hexdigest()
        product_id = candidate["product_id"]
        if not isinstance(product_id, int) or isinstance(product_id, bool) or product_id < 1:
            raise ValueError("Invalid WooCommerce product ID")
        payload = {
            "name": name,
            "sku": sku,
            "product_id": product_id,
            "price": format(price, ".2f"),
            "currency": self.settings.currency,
            "images": [{"src": url} for url in gallery],
            "source_id": source,
        }
        digest = hashlib.sha256(canonical(payload).encode()).hexdigest()
        return digest, payload

    def source(self) -> dict[str, Any]:
        if not self.settings.woo_origin:
            raise ValueError("Configure the WooCommerce source origin")
        url = self.settings.woo_origin.rstrip("/") + self.settings.source_api_path
        products = []
        seen: set[int] = set()
        try:
            for page in range(1, self.settings.source_page_limit + 1):
                response = self.client.get(
                    url,
                    params={
                        "page": page,
                        "per_page": self.settings.source_page_size,
                        "orderby": "id",
                        "order": "asc",
                    },
                )
                response.raise_for_status()
                rows = response.json()
                if not isinstance(rows, list):
                    raise ValueError("Unexpected source response")
                for product in rows:
                    identity = product["id"]
                    if identity in seen:
                        raise ValueError("Source pagination repeated a product")
                    seen.add(identity)
                    if identity in self.settings.source_excluded_ids:
                        continue
                    prices = product["prices"]
                    minor = prices["currency_minor_unit"]
                    if minor != 2 or not str(prices["price"]).isdigit():
                        raise ValueError("Unsupported source price encoding")
                    products.append(
                        {
                            "source_id": str(identity),
                            "product_id": identity,
                            "name": product["name"],
                            "availability": "available"
                            if product["is_in_stock"]
                            else "unavailable",
                            "price": str(Decimal(prices["price"]) / (10**minor)),
                            "currency": prices["currency_code"],
                            "photos": [image["src"] for image in product["images"]],
                        }
                    )
                    if len(products) > self.settings.batch_limit:
                        raise ValueError("Source exceeds configured batch limit")
                total_pages = int(response.headers.get("X-WP-TotalPages", "0"))
                if (total_pages and page >= total_pages) or len(
                    rows
                ) < self.settings.source_page_size:
                    break
            else:
                raise ValueError("Source pagination exceeds configured limit")
        except (httpx.HTTPError, ValueError, KeyError, TypeError, InvalidOperation) as exc:
            raise TargetError("WooCommerce source could not be read completely") from exc
        if not products:
            with self.lock, self.db:
                self.db.execute("UPDATE social_queue SET status='not_eligible'")
                self.db.execute("DELETE FROM current_catalog")
                self.db.execute("INSERT OR REPLACE INTO batch_head VALUES (1,'')")
            return {"batch_id": "", "items": [], "empty": True}
        identifiers = [product["product_id"] for product in products]
        with self.lock, self.db:
            self.db.execute("DELETE FROM current_catalog")
            self.db.executemany(
                "INSERT INTO current_catalog VALUES (?)", [(i,) for i in identifiers]
            )
            self.db.execute(
                "UPDATE social_queue SET status='not_eligible' WHERE product NOT IN "
                "(SELECT product FROM current_catalog)"
            )
            return self._accept(products)

    def record(self, payload: dict[str, Any], digest: str) -> dict[str, Any]:
        product = payload["product_id"]
        with self.db:
            self.db.execute(
                "INSERT OR REPLACE INTO imports VALUES (?,?,?,?,?)",
                (payload["sku"], "staged", digest, product, canonical(payload)),
            )
            self.db.execute(
                "INSERT INTO social_queue(sku,product,data) VALUES (?,?,?) "
                "ON CONFLICT(sku) DO UPDATE SET product=excluded.product,"
                "data=excluded.data,status='pending_review' "
                "WHERE social_queue.data != excluded.data OR social_queue.status='not_eligible'",
                (payload["sku"], product, canonical(payload)),
            )
        return {"status": "queued", "product_id": product, "social_status": "pending_review"}

    def process(self, data: dict[str, Any]) -> dict[str, Any]:
        batch, ordinal = data.get("batch_id"), data.get("ordinal")
        if not isinstance(batch, str) or not isinstance(ordinal, int) or isinstance(ordinal, bool):
            raise ValueError("Invalid item reference")
        with self.lock:
            row = self.db.execute(
                "SELECT data,result FROM candidates WHERE batch=? AND ordinal=?", (batch, ordinal)
            ).fetchone()
            if not row:
                raise ValueError("Unknown item reference")
            if row[1]:
                return dict(json.loads(row[1]))
            head = self.db.execute("SELECT batch FROM batch_head WHERE singleton=1").fetchone()
            if not head or head[0] != batch:
                raise ValueError("Batch superseded; start a new source sync")
            earlier = self.db.execute(
                "SELECT COUNT(*) FROM candidates WHERE batch=? AND ordinal<? AND result IS NULL",
                (batch, ordinal),
            ).fetchone()
            if earlier and earlier[0]:
                raise ValueError("Process batch items in sequence")
            try:
                digest, payload = self.normalize(json.loads(row[0]))
                result: dict[str, Any] = (
                    self.record(payload, digest)
                    if payload
                    else {"status": "skipped", "reason": digest}
                )
            except (ValueError, TypeError) as exc:
                # Only our bounded validation messages; no raw source/provider data.
                result = {"status": "invalid", "reason": str(exc)}
            result.update({"batch_id": batch, "ordinal": ordinal})
            with self.db:
                candidate = json.loads(row[0])
                if result["status"] in {"skipped", "invalid"} and isinstance(candidate, dict):
                    identity = candidate.get("product_id")
                    if isinstance(identity, int) and not isinstance(identity, bool):
                        self.db.execute(
                            "UPDATE social_queue SET status='not_eligible' WHERE product=?",
                            (identity,),
                        )
                self.db.execute(
                    "UPDATE candidates SET result=? WHERE batch=? AND ordinal=?",
                    (canonical(result), batch, ordinal),
                )
            return result

    def summary(self, batch: str) -> dict[str, Any]:
        with self.lock:
            rows = self.db.execute(
                "SELECT result FROM candidates WHERE batch=? ORDER BY ordinal", (batch,)
            ).fetchall()
        if not rows:
            raise ValueError("Unknown batch")
        return {
            "batch_id": batch,
            "complete": all(row[0] for row in rows),
            "results": [json.loads(row[0]) if row[0] else {"status": "pending"} for row in rows],
        }

    def queue(self) -> list[dict[str, Any]]:
        with self.lock:
            rows = self.db.execute(
                "SELECT product,data,status FROM social_queue ORDER BY sku"
            ).fetchall()
        return [
            {"product_id": row[0], "listing": json.loads(row[1]), "status": row[2]} for row in rows
        ]
