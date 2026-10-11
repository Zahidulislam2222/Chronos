import json
import os
import runpy
import socket
import subprocess
import sys
import threading
from ipaddress import ip_address
from pathlib import Path

import httpx
import pytest
import yaml
from dotenv import dotenv_values
from pydantic import ValidationError

from chronos_inventory.config import Settings
from chronos_inventory.engine import Engine, TargetError
from chronos_inventory.server import server

ROOT = Path(__file__).parents[1]
TOKEN = "test-key-for-local-inventory-only"


@pytest.fixture
def settings(tmp_path):
    values = {
        key.removeprefix("CHRONOS_INVENTORY_").lower(): value
        for key, value in dotenv_values(ROOT / ".env.example").items()
    }
    values.update(
        token=TOKEN,
        database=tmp_path / "state.sqlite3",
        image_hosts=["images.test"],
        available_statuses=["available"],
        source_excluded_ids=[],
        woo_origin="https://shop.test",
        bind_host="127.0.0.1",
    )
    return Settings.model_validate(values)


def product(identity=1, **changes):
    item = {
        "source_id": str(identity),
        "product_id": identity,
        "name": "Watch",
        "availability": "available",
        "price": "125.20",
        "currency": "BDT",
        "photos": [
            "https://images.test/1.jpg",
            "https://images.test/2.jpg",
            "https://images.test/1.jpg",
        ],
    }
    return {**item, **changes}


def source_product(identity=1, **changes):
    return {
        "id": identity,
        "name": "Watch",
        "is_in_stock": True,
        "prices": {"price": "12520", "currency_code": "BDT", "currency_minor_unit": 2},
        "images": [{"src": "https://images.test/1.jpg"}, {"src": "https://images.test/2.jpg"}],
        **changes,
    }


def test_gallery_pricing_skip_sequence_and_restart(settings):
    engine = Engine(settings)
    accepted = engine.accept(
        {
            "items": [
                product(),
                product(2, photos=[]),
                product(3, availability="unavailable"),
                product(4, currency="USD"),
                product(5),
            ]
        }
    )
    with pytest.raises(ValueError, match="sequence"):
        engine.process(accepted["items"][1])
    results = [engine.process(item)["status"] for item in accepted["items"]]
    assert results == ["queued", "skipped", "skipped", "invalid", "queued"]
    assert engine.summary(accepted["batch_id"])["complete"]
    gallery = engine.queue()[0]["listing"]["images"]
    assert gallery == [{"src": "https://images.test/1.jpg"}, {"src": "https://images.test/2.jpg"}]
    assert engine.queue()[0]["listing"]["price"] == "125.20"
    engine.close()
    restarted = Engine(settings)
    assert len(restarted.queue()) == 2
    assert restarted.process(accepted["items"][0])["status"] == "queued"
    again = restarted.accept({"items": [product()]})
    restarted.process(again["items"][0])
    assert len(restarted.queue()) == 2
    restarted.close()


@pytest.mark.parametrize(
    "changes",
    [
        {"price": "NaN"},
        {"price": "-1"},
        {"price": "1.001"},
        {"price": 1.0},
        {"photos": ["https://evil.test/1.jpg"]},
        {"photos": ["http://images.test/1.jpg"]},
        {"photos": ["https://user:pass@images.test/1.jpg"]},
        {"product_id": True},
        {"photos": ["https://images.test:8443/1.jpg"]},
        {"source_id": ""},
    ],
)
def test_invalid_values_never_queue(settings, changes):
    engine = Engine(settings)
    batch = engine.accept({"items": [product(**changes)]})
    assert engine.process(batch["items"][0])["status"] == "invalid"
    assert engine.queue() == []
    engine.close()


def test_bounded_source_pagination_and_read_only(settings):
    requested = []

    def handle(request):
        requested.append(request)
        assert request.method == "GET"
        page = int(request.url.params["page"])
        return httpx.Response(200, json=[source_product(page)], headers={"X-WP-TotalPages": "2"})

    settings = settings.model_copy(update={"source_page_size": 1})
    engine = Engine(settings, httpx.Client(transport=httpx.MockTransport(handle)))
    batch = engine.source()
    assert len(batch["items"]) == 2
    for item in batch["items"]:
        assert engine.process(item)["status"] == "queued"
    assert [str(r.url.path) for r in requested] == [settings.source_api_path] * 2
    assert engine.queue()[0]["listing"]["price"] == "125.20"
    engine.close()


@pytest.mark.parametrize("mode", ["repeat", "limit", "redirect", "malformed"])
def test_incomplete_source_never_accepts_partial_batch(settings, mode):
    def handle(request):
        if mode == "redirect":
            return httpx.Response(302, headers={"Location": "https://evil.test"})
        if mode == "malformed":
            return httpx.Response(200, json={"unexpected": True})
        identity = 1 if mode == "repeat" else int(request.url.params["page"])
        return httpx.Response(
            200, json=[source_product(identity)], headers={"X-WP-TotalPages": "100"}
        )

    settings = settings.model_copy(update={"source_page_size": 1, "source_page_limit": 2})
    engine = Engine(settings, httpx.Client(transport=httpx.MockTransport(handle)))
    with pytest.raises(TargetError):
        engine.source()
    assert engine.db.execute("SELECT COUNT(*) FROM batches").fetchone()[0] == 0
    engine.close()


def test_empty_and_excluded_sources(settings):
    client = httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(200, json=[])))
    engine = Engine(settings, client)
    assert engine.source() == {"batch_id": "", "items": [], "empty": True}
    engine.close()
    settings = settings.model_copy(update={"source_excluded_ids": [1]})
    engine = Engine(
        settings,
        httpx.Client(
            transport=httpx.MockTransport(lambda _: httpx.Response(200, json=[source_product()]))
        ),
    )
    assert engine.source()["empty"]
    engine.close()


def test_stress_full_batch_continues_after_invalid_and_no_photo(settings):
    engine = Engine(settings)
    items = [
        product(i + 1, photos=[] if i % 3 == 0 else ["https://images.test/1.jpg"])
        for i in range(settings.batch_limit)
    ]
    batch = engine.accept({"items": items})
    for item in batch["items"]:
        engine.process(item)
    assert len(engine.summary(batch["batch_id"])["results"]) == settings.batch_limit
    assert len(engine.queue()) == 66
    with pytest.raises(ValueError):
        engine.accept({"items": items + [product(101)]})
    engine.close()


def test_real_http_auth_intake_queue_and_bounds(settings):
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    settings = settings.model_copy(update={"port": port, "body_limit": 2000})
    engine = Engine(settings)
    instance = server(settings, engine)
    worker = threading.Thread(target=instance.serve_forever, daemon=True)
    worker.start()
    try:
        with httpx.Client(base_url=f"http://127.0.0.1:{port}", trust_env=False) as client:
            assert client.get("/healthz").json()["woocommerce_access"] == "read_only"
            assert client.get("/queue").status_code == 401
            client.headers["Authorization"] = "Bearer " + TOKEN
            accepted = client.post("/batches", json={"items": [product()]}).json()
            assert client.post("/items", json=accepted["items"][0]).json()["status"] == "queued"
            assert client.get("/batches/" + accepted["batch_id"]).json()["complete"]
            assert len(client.get("/queue").json()) == 1
            assert (
                client.post(
                    "/items", content="a" * 2001, headers={"Content-Type": "application/json"}
                ).status_code
                == 413
            )
            assert (
                client.post(
                    "/batches",
                    content='{"items":[NaN]}',
                    headers={"Content-Type": "application/json"},
                ).status_code
                == 400
            )
    finally:
        instance.shutdown()
        instance.server_close()
        worker.join()
        engine.close()


def test_configuration_boundary_and_graph():
    config = json.loads((ROOT / "workflow-settings.json").read_text())
    graph = runpy.run_path(str(ROOT / "build_workflow.py"))["generate"](config)
    assert graph == json.loads((ROOT / "workflow.json").read_text())
    loop = next(node for node in graph["nodes"] if node["type"].endswith("splitInBatches"))
    assert loop["parameters"] == {"batchSize": 1, "options": {}}
    assert (
        graph["connections"]["Validate gallery and queue draft"]["main"][0][0]["node"]
        == loop["name"]
    )
    assert graph["active"] is False
    for path in (ROOT / "src").rglob("*.py"):
        text = path.read_text()
        assert "https://" not in text and "http://" not in text
        assert "sk-ant-" not in text and "PRIVATE KEY" not in text
        assert ".post(" not in text and ".put(" not in text and ".delete(" not in text
    env_keys = {
        key.removeprefix("CHRONOS_INVENTORY_").lower()
        for key in dotenv_values(ROOT / ".env.example")
    }
    assert env_keys == set(Settings.model_fields)


def test_configuration_rejects_weak_auth_and_non_https(settings):
    for changes in [
        {"token": "test-key"},
        {"woo_origin": "http://shop.test"},
        {"woo_origin": "https://shop.test/private"},
        {"unexpected": True},
    ]:
        with pytest.raises(ValidationError):
            Settings.model_validate({**settings.model_dump(), **changes})


def test_refresh_disables_old_listing_and_reenables_restored_product(settings):
    engine = Engine(settings)

    def process(candidate):
        batch = engine.accept({"items": [candidate]})
        return engine.process(batch["items"][0])

    process(product())
    assert engine.queue()[0]["status"] == "pending_review"
    process(product(availability="unavailable"))
    assert engine.queue()[0]["status"] == "not_eligible"
    process(product())
    assert engine.queue()[0]["status"] == "pending_review"
    engine.client.close()
    engine.client = httpx.Client(
        transport=httpx.MockTransport(lambda _: httpx.Response(200, json=[]))
    )
    engine.source()
    assert engine.queue()[0]["status"] == "not_eligible"
    engine.close()


@pytest.mark.parametrize(
    "new_source",
    [
        [],
        [
            source_product(
                prices={
                    "price": "20000",
                    "currency_code": "BDT",
                    "currency_minor_unit": 2,
                }
            )
        ],
    ],
)
def test_superseded_batch_cannot_restore_removed_product_or_old_price(settings, new_source):
    engine = Engine(settings)
    initial = engine.accept({"items": [product()]})
    engine.process(initial["items"][0])
    old = engine.accept({"items": [product(price="1.00")]})
    engine.client.close()
    engine.client = httpx.Client(
        transport=httpx.MockTransport(lambda _: httpx.Response(200, json=new_source))
    )
    latest = engine.source()
    for item in latest["items"]:
        engine.process(item)
    expected = engine.queue()
    engine.close()
    restarted = Engine(settings)
    with pytest.raises(ValueError, match="superseded"):
        restarted.process(old["items"][0])
    assert restarted.queue() == expected
    if new_source:
        assert expected[0]["listing"]["price"] == "200.00"
    else:
        assert expected[0]["status"] == "not_eligible"
    # Completed references remain readable without changing current queue state.
    assert restarted.process(initial["items"][0])["status"] == "queued"
    assert restarted.queue() == expected
    restarted.close()


@pytest.mark.parametrize(
    "url",
    [
        "https://images.test:RAW-UNTRUSTED-VALUE/a.jpg",
        "https://[RAW-UNTRUSTED-VALUE/a.jpg",
    ],
)
def test_malformed_photo_errors_are_bounded(settings, url):
    engine = Engine(settings)
    batch = engine.accept({"items": [product(photos=[url])]})
    result = engine.process(batch["items"][0])
    assert result["status"] == "invalid"
    assert "RAW-UNTRUSTED-VALUE" not in json.dumps(result)
    assert engine.queue() == []
    engine.close()


def test_startup_configuration_does_not_expose_inputs(settings):
    env = {k: v for k, v in os.environ.items() if not k.startswith("CHRONOS_INVENTORY_")}
    for key, value in settings.model_dump(mode="json").items():
        env["CHRONOS_INVENTORY_" + key.upper()] = (
            ",".join(map(str, value)) if isinstance(value, list) else str(value)
        )
    env["CHRONOS_INVENTORY_TOKEN"] = TOKEN
    env["CHRONOS_INVENTORY_WOO_ORIGIN"] = "http://invalid.test"
    env["PYTHONPATH"] = str(ROOT / "src")
    result = subprocess.run(
        [sys.executable, "-m", "chronos_inventory.server"],
        env=env,
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
    )
    assert result.returncode != 0
    assert result.stderr.strip() == "Inventory configuration invalid; check private settings"
    assert TOKEN[:12] not in result.stderr


def test_container_configuration_matches_writable_volume_and_service_network():
    compose = yaml.safe_load((ROOT / "deploy/compose.yaml").read_text())
    inventory = compose["services"]["inventory"]
    environment = inventory["environment"]
    database = Path(environment["CHRONOS_INVENTORY_DATABASE"])
    assert database.is_absolute() and str(database.parent) == "/state"
    assert "inventory_data:/state" in inventory["volumes"] and inventory["read_only"]
    assert ip_address(environment["CHRONOS_INVENTORY_BIND_HOST"]).is_unspecified
    assert environment["CHRONOS_INVENTORY_PORT"] == "${INVENTORY_PORT:?}"
    assert all(port.startswith("127.0.0.1:") for port in inventory["ports"])
