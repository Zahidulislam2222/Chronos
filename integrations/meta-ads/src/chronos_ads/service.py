"""Business operations, reviewable proposals and fail-closed execution policy."""

from __future__ import annotations

import hashlib
import json
import time
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from .config import Settings, load_profile
from .protocol import AWARENESS_OBJECTIVE, PAUSED_STATUS, Account, Campaign, Change
from .provider import AdsProvider, MetaProvider, OfflineProvider, ProviderError, UncertainWrite
from .store import StateError, Store


class AdsService:
    def __init__(self, settings: Settings, provider: AdsProvider | None = None):
        self.settings = settings
        self.profile = load_profile(settings)
        self.provider: AdsProvider = provider or (
            MetaProvider(settings) if settings.mode == "live" else OfflineProvider(settings)
        )
        self.store = Store(settings.state_db, settings.database_timeout_seconds)
        self.account_verified = False

    def close(self) -> None:
        self.provider.close()

    def clean(self, value: Any) -> Any:
        """Strip the configured credential even if untrusted remote content echoes it."""
        text = json.dumps(value, ensure_ascii=False, default=str)
        token = self.settings.meta_token.get_secret_value()
        if token:
            text = text.replace(token, "[redacted]")
        return json.loads(text)

    def context(self) -> dict[str, Any]:
        return {
            "mode": self.settings.mode,
            "source": "meta" if self.settings.mode == "live" else "synthetic",
            "connected": self.account_verified,
            "live_writes_enabled": self.settings.mode == "live" and self.settings.write_enabled,
        }

    def business(self) -> dict[str, Any]:
        return {**self.context(), "business": self.profile.model_dump()}

    def account(self) -> dict[str, Any]:
        account = self._read_account()
        return {**self.context(), "account": account.model_dump()}

    def _read_account(self) -> Account:
        self.account_verified = False
        account = self.provider.account()
        self.account_verified = self.settings.mode == "live"
        return account

    def _campaigns(self) -> list[Campaign]:
        values = {row.id: row for row in self.provider.campaigns()}
        if self.settings.mode == "offline":
            for proposal in reversed(self.store.list_proposals()):
                if proposal["state"] != "applied" or proposal["document"]["scope"] != self._scope():
                    continue
                change = Change.model_validate(proposal["document"]["change"])
                if change.operation == "create_paused_campaign":
                    campaign_id = proposal["result"]["id"]
                    values[campaign_id] = Campaign(
                        id=campaign_id,
                        name=change.name,
                        status=PAUSED_STATUS,
                        effective_status=PAUSED_STATUS,
                        objective=AWARENESS_OBJECTIVE,
                        account_id=self.provider.account().id.removeprefix("act_"),
                    )
                elif change.campaign_id in values:
                    values[change.campaign_id] = values[change.campaign_id].model_copy(
                        update={"status": PAUSED_STATUS, "effective_status": PAUSED_STATUS}
                    )
        return list(values.values())

    def campaigns(self) -> dict[str, Any]:
        return {**self.context(), "campaigns": [row.model_dump() for row in self._campaigns()]}

    def _campaign(self, campaign_id: str) -> Campaign:
        if self.settings.mode == "live":
            return self.provider.campaign(campaign_id)
        for row in self._campaigns():
            if row.id == campaign_id:
                return row
        raise ProviderError("Campaign not found")

    def report(self, since: str, until: str) -> dict[str, Any]:
        start, end = date.fromisoformat(since), date.fromisoformat(until)
        if end < start or (end - start).days + 1 > self.settings.max_report_days:
            raise ValueError("Invalid report interval; use the configured date-range limit")
        account = self._read_account()
        rows = self.provider.insights(start, end)
        formatted: list[dict[str, Any]] = []
        for row in rows:
            try:
                spend, impressions, clicks = (
                    Decimal(str(row[k])) for k in ("spend", "impressions", "clicks")
                )
                if not all(x.is_finite() and x >= 0 for x in (spend, impressions, clicks)):
                    raise ValueError("Invalid metric")
                formatted.append(
                    {
                        **row,
                        "ctr_percent": str(clicks / impressions * 100) if impressions else None,
                        "cpc": str(spend / clicks) if clicks else None,
                        "cpm": str(spend / impressions * 1000) if impressions else None,
                    }
                )
            except (KeyError, InvalidOperation, ValueError):
                raise ProviderError("Report contains invalid metrics") from None
        return {
            **self.context(),
            "currency": account.currency,
            "timezone": account.timezone_name,
            "since": since,
            "until": until,
            "click_definition": "Meta clicks (all); not link clicks or conversions",
            "rows": formatted,
            "roas": None,
            "attribution": "Not requested; no revenue claim",
        }

    def _scope(self) -> dict[str, Any]:
        account = self._read_account()
        offline_digest = (
            hashlib.sha256(self.settings.offline_data_path.read_bytes()).hexdigest()
            if self.settings.mode == "offline"
            else None
        )
        return {
            "mode": self.settings.mode,
            "account_id": account.id,
            "currency": account.currency,
            "origin": self.settings.meta_origin,
            "api_version": self.settings.api_version,
            "offline_data_digest": offline_digest,
        }

    def propose(self, operation: str, name: str = "", campaign_id: str = "") -> dict[str, Any]:
        token = self.settings.meta_token.get_secret_value()
        if token and token in name:
            raise ValueError("Campaign name contains credential material")
        change = Change.model_validate(
            {"operation": operation, "name": name.strip(), "campaign_id": campaign_id}
        )
        before: dict[str, Any] | None = None
        if change.operation == "create_paused_campaign":
            if not change.name or change.campaign_id:
                raise ValueError("Paused campaign creation requires a name and no campaign ID")
            after = {
                "name": change.name,
                "status": PAUSED_STATUS,
                "objective": AWARENESS_OBJECTIVE,
                "special_ad_categories": [],
            }
        else:
            if change.name or not change.campaign_id:
                raise ValueError("Pause requires only a campaign ID")
            before = self._campaign(change.campaign_id).model_dump()
            if before["status"] == PAUSED_STATUS:
                raise ValueError("Campaign is already paused")
            after = {"id": change.campaign_id, "status": PAUSED_STATUS}
        proposal = self.store.create(
            {
                "scope": self._scope(),
                "change": change.model_dump(),
                "before": self.clean(before),
                "after": self.clean(after),
                "cost": {
                    "new_spend_authorized": False,
                    "operation_charge": "0",
                    "scope": "No activation, budget increase, ad set or ad publication",
                },
                "approval": "Owner must review and approve through the separate local CLI",
            },
            time.time(),
            self.settings.proposal_ttl_seconds,
        )
        return {**self.context(), "proposal": proposal}

    def execute(self, proposal_id: str) -> dict[str, Any]:
        proposal = self.store.get(proposal_id)
        if self.settings.mode == "live" and not self.settings.write_enabled:
            raise StateError("Live writes disabled; proposal remains unexecuted")
        if proposal["document"]["scope"] != self._scope():
            raise StateError("Proposal configuration/account changed; create a new proposal")
        change = Change.model_validate(proposal["document"]["change"])
        # Claim BEFORE remote calls. A crash leaves executing, which cannot be replayed.
        self.store.transition(proposal_id, "approved", "executing", time.time(), "executor")
        try:
            if change.operation == "pause_campaign":
                current = self.clean(self._campaign(change.campaign_id).model_dump())
                if current != proposal["document"]["before"]:
                    raise StateError("Campaign changed after proposal; review a new proposal")
            result = self.provider.apply(change)
            if self.settings.mode == "offline" and change.operation == "create_paused_campaign":
                result["id"] = str(int(proposal_id, 16))
        except UncertainWrite:
            self.store.transition(proposal_id, "executing", "uncertain", time.time(), "executor")
            raise
        except (StateError, ProviderError, ValueError):
            self.store.transition(proposal_id, "executing", "failed", time.time(), "executor")
            raise
        result = self.clean(result)
        self.store.transition(proposal_id, "executing", "applied", time.time(), "executor", result)
        return {**self.context(), "proposal": self.store.get(proposal_id)}
