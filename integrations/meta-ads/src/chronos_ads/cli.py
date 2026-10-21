"""Owner-only local approval surface; never register approval with MCP."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
from pathlib import Path
from typing import Any

from .config import Settings
from .provider import ProviderError
from .service import AdsService
from .store import StateError


def main() -> None:
    parser = argparse.ArgumentParser(description="Chronos advertising operator")
    parser.add_argument("--env-file", type=Path)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("serve", "status", "campaigns", "proposals"):
        commands.add_parser(name)
    report = commands.add_parser("report")
    report.add_argument("since")
    report.add_argument("until")
    create = commands.add_parser("propose-create")
    create.add_argument("name")
    pause = commands.add_parser("propose-pause")
    pause.add_argument("campaign_id")
    for name in ("review", "approve", "reject", "execute", "recover"):
        command = commands.add_parser(name)
        command.add_argument("proposal_id")
    args = parser.parse_args()
    try:
        settings = Settings.load(args.env_file)
        service = AdsService(settings)
    except (ValueError, OSError, sqlite3.Error):
        parser.exit(2, "Invalid local configuration; check environment and content files\n")
    try:
        result: Any
        if args.command == "serve":
            from .server import build_server

            build_server(service).run(transport="stdio")
            return
        if args.command == "status":
            result = service.account()
        elif args.command == "campaigns":
            result = service.campaigns()
        elif args.command == "report":
            result = service.report(args.since, args.until)
        elif args.command == "proposals":
            result = service.store.list_proposals()
        elif args.command == "propose-create":
            result = service.propose("create_paused_campaign", name=args.name)
        elif args.command == "propose-pause":
            result = service.propose("pause_campaign", campaign_id=args.campaign_id)
        elif args.command == "review":
            result = {
                "proposal": service.store.get(args.proposal_id),
                "events": service.store.events(args.proposal_id),
            }
        elif args.command in ("approve", "reject", "recover"):
            proposal = service.store.get(args.proposal_id)
            print(json.dumps(service.clean(proposal), indent=2))
            if not sys.stdin.isatty():
                raise StateError("Owner decision requires an interactive terminal")
            expected = f"{args.command.upper()} {args.proposal_id}"
            print(f"Type {expected} after reviewing the exact account, change and cost scope:")
            if input().strip() != expected:
                raise StateError("Owner decision not confirmed")
            if args.command == "approve":
                result = service.store.transition(
                    args.proposal_id, "pending", "approved", time.time(), "local-owner"
                )
            elif args.command == "reject":
                if proposal["state"] not in ("pending", "approved"):
                    raise StateError("Only pending or approved proposals can be rejected")
                result = service.store.transition(
                    args.proposal_id, proposal["state"], "rejected", time.time(), "local-owner"
                )
            else:
                result = service.store.transition(
                    args.proposal_id, "executing", "uncertain", time.time(), "local-owner"
                )
        else:
            result = service.execute(args.proposal_id)
        print(json.dumps(service.clean(result), indent=2, ensure_ascii=False))
    except (ProviderError, StateError) as error:
        parser.exit(2, f"{error}\n")
    except (ValueError, OSError, KeyError, TypeError, sqlite3.Error):
        parser.exit(2, "Operation failed; inspect local settings and provider data\n")
    finally:
        service.close()


if __name__ == "__main__":
    main()
