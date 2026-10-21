"""Durable exact proposals, transactional execution claims and append-only events."""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


class StateError(Exception):
    """A proposal is missing, expired or in an incompatible state."""


class Store:
    def __init__(self, path: Path, timeout: float):
        self.path = path
        self.timeout = timeout
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS proposals (
                    id TEXT PRIMARY KEY, document TEXT NOT NULL,
                    state TEXT NOT NULL, expires REAL NOT NULL,
                    result TEXT
                );
                CREATE TABLE IF NOT EXISTS events (
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    proposal_id TEXT NOT NULL, event TEXT NOT NULL,
                    at REAL NOT NULL, actor TEXT NOT NULL
                );
            """)
        path.chmod(0o600)

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        db = sqlite3.connect(self.path, timeout=self.timeout, isolation_level=None)
        db.row_factory = sqlite3.Row
        try:
            yield db
        finally:
            db.close()

    def create(self, document: dict[str, Any], now: float, ttl: int) -> dict[str, Any]:
        proposal_id = uuid4().hex
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                "INSERT INTO proposals VALUES (?, ?, 'pending', ?, NULL)",
                (proposal_id, json.dumps(document, sort_keys=True), now + ttl),
            )
            db.execute(
                "INSERT INTO events(proposal_id,event,at,actor) VALUES (?, ?, ?, ?)",
                (proposal_id, "proposed", now, "assistant"),
            )
            db.commit()
        return self.get(proposal_id)

    def get(self, proposal_id: str) -> dict[str, Any]:
        with self.connection() as db:
            row = db.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone()
        if row is None:
            raise StateError("Proposal not found")
        return {
            "id": row["id"],
            "document": json.loads(row["document"]),
            "state": row["state"],
            "expires": row["expires"],
            "expires_at": datetime.fromtimestamp(row["expires"], UTC).isoformat(),
            "result": json.loads(row["result"]) if row["result"] else None,
        }

    def list_proposals(self) -> list[dict[str, Any]]:
        with self.connection() as db:
            rows = db.execute("SELECT id FROM proposals ORDER BY rowid DESC").fetchall()
        return [self.get(row["id"]) for row in rows]

    def events(self, proposal_id: str) -> list[dict[str, Any]]:
        with self.connection() as db:
            rows = db.execute(
                "SELECT * FROM events WHERE proposal_id = ? ORDER BY sequence", (proposal_id,)
            ).fetchall()
        return [dict(row) for row in rows]

    def transition(
        self,
        proposal_id: str,
        expected: str,
        target: str,
        now: float,
        actor: str,
        result: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        allowed = {
            ("pending", "approved"),
            ("pending", "rejected"),
            ("approved", "rejected"),
            ("approved", "executing"),
            ("executing", "applied"),
            ("executing", "failed"),
            ("executing", "uncertain"),
        }
        if (expected, target) not in allowed:
            raise StateError("Invalid proposal transition")
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone()
            if row is None or row["state"] != expected:
                db.rollback()
                raise StateError("Proposal state changed or proposal cannot be reused")
            if target in ("approved", "executing") and now >= row["expires"]:
                db.rollback()
                raise StateError("Proposal expired; prepare and review a new proposal")
            db.execute(
                "UPDATE proposals SET state = ?, result = ? WHERE id = ?",
                (target, json.dumps(result) if result is not None else None, proposal_id),
            )
            db.execute(
                "INSERT INTO events(proposal_id,event,at,actor) VALUES (?, ?, ?, ?)",
                (proposal_id, target, now, actor),
            )
            db.commit()
        return self.get(proposal_id)
