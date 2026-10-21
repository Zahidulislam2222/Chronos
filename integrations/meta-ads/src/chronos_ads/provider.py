"""Account-scoped HTTP adapter; no arbitrary URLs, write retries or token logging."""

from __future__ import annotations

import json
from datetime import date
from typing import Any, Protocol

import httpx
from pydantic import BaseModel, ConfigDict

from .config import Settings
from .protocol import (
    ACCOUNT_FIELDS,
    AWARENESS_OBJECTIVE,
    CAMPAIGN_FIELDS,
    INSIGHT_FIELDS,
    PAUSED_STATUS,
    Account,
    Campaign,
    Change,
)


class ProviderError(Exception):
    """A deliberately sanitized provider failure."""


class UncertainWrite(ProviderError):
    """Remote mutation outcome is unknown: inspect account, never auto-retry."""


class AdsProvider(Protocol):
    def account(self) -> Account: ...
    def campaigns(self) -> list[Campaign]: ...
    def campaign(self, campaign_id: str) -> Campaign: ...
    def insights(self, since: date, until: date) -> list[dict[str, Any]]: ...
    def apply(self, change: Change) -> dict[str, Any]: ...
    def close(self) -> None: ...


class MetaProvider:
    def __init__(self, settings: Settings, transport: httpx.BaseTransport | None = None):
        self.settings = settings
        self.client = httpx.Client(
            base_url=f"{settings.meta_origin}/{settings.api_version}/",
            headers={"Authorization": f"Bearer {settings.meta_token.get_secret_value()}"},
            timeout=settings.timeout_seconds,
            follow_redirects=False,
            trust_env=False,
            transport=transport,
        )

    def close(self) -> None:
        self.client.close()

    def _request(self, path: str, params: dict[str, Any], *, write: bool = False) -> Any:
        try:
            response = (
                self.client.post(path, data=params)
                if write
                else self.client.get(path, params=params)
            )
        except httpx.HTTPError:
            if write:
                raise UncertainWrite(
                    "Meta write interrupted; inspect account before retry"
                ) from None
            raise ProviderError(
                "Meta read failed; check connection and credentials locally"
            ) from None
        if response.status_code >= 500 and write:
            raise UncertainWrite("Meta write outcome unknown; inspect the account")
        if not response.is_success:
            raise ProviderError(
                f"Meta rejected request (HTTP {response.status_code}); check access"
            )
        try:
            payload = response.json()
        except ValueError:
            error_type = UncertainWrite if write else ProviderError
            raise error_type("Meta returned an invalid response") from None
        if not isinstance(payload, dict) or "error" in payload:
            error_type = UncertainWrite if write else ProviderError
            raise error_type("Meta returned an unexpected response")
        return payload

    def _pages(self, edge: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        seen: set[str] = set()
        query = {**params, "limit": self.settings.page_size}
        for _ in range(self.settings.max_pages):
            payload = self._request(f"{self.settings.account_id}/{edge}", query)
            if not isinstance(payload.get("data"), list):
                raise ProviderError("Meta collection response is invalid")
            if not all(isinstance(row, dict) for row in payload["data"]):
                raise ProviderError("Meta collection contains invalid records")
            records.extend(payload["data"])
            paging = payload.get("paging", {})
            if not isinstance(paging, dict):
                raise ProviderError("Meta pagination response is invalid")
            if not paging.get("next"):
                return records
            # Never follow provider-supplied URLs (may contain credentials or point elsewhere).
            cursors = paging.get("cursors", {})
            if not isinstance(cursors, dict):
                raise ProviderError("Meta pagination cursors are invalid")
            cursor = cursors.get("after")
            if not isinstance(cursor, str) or cursor in seen:
                raise ProviderError("Meta pagination cursor is invalid or repeated")
            seen.add(cursor)
            query["after"] = cursor
        raise ProviderError("Meta pagination limit reached; narrow the report scope")

    def account(self) -> Account:
        value = Account.model_validate(
            self._request(self.settings.account_id, {"fields": ACCOUNT_FIELDS})
        )
        if value.id != self.settings.account_id:
            raise ProviderError("Meta account does not match configured account")
        return value

    def campaigns(self) -> list[Campaign]:
        values = [
            Campaign.model_validate(row)
            for row in self._pages("campaigns", {"fields": CAMPAIGN_FIELDS})
        ]
        if any(f"act_{row.account_id}" != self.settings.account_id for row in values):
            raise ProviderError("Meta returned a campaign outside the configured account")
        return values

    def campaign(self, campaign_id: str) -> Campaign:
        if not campaign_id.isascii() or not campaign_id.isdigit():
            raise ValueError("Campaign ID must contain digits")
        campaign = Campaign.model_validate(self._request(campaign_id, {"fields": CAMPAIGN_FIELDS}))
        if campaign.id != campaign_id or f"act_{campaign.account_id}" != self.settings.account_id:
            raise ProviderError("Campaign does not belong to the configured account")
        return campaign

    def insights(self, since: date, until: date) -> list[dict[str, Any]]:
        return self._pages(
            "insights",
            {
                "fields": INSIGHT_FIELDS,
                "level": "campaign",
                "time_range": json.dumps({"since": since.isoformat(), "until": until.isoformat()}),
            },
        )

    def apply(self, change: Change) -> dict[str, Any]:
        if not self.settings.write_enabled:
            raise ProviderError("Live writes are disabled in local configuration")
        if change.operation == "create_paused_campaign":
            payload = self._request(
                f"{self.settings.account_id}/campaigns",
                {
                    "name": change.name,
                    "objective": AWARENESS_OBJECTIVE,
                    "status": PAUSED_STATUS,
                    "special_ad_categories": "[]",
                },
                write=True,
            )
            if not isinstance(payload.get("id"), str) or not payload["id"].isdigit():
                raise UncertainWrite("Meta did not return a valid created campaign ID")
            return self._verify_paused(payload["id"])
        # Recheck ownership at the mutation boundary, even for non-service callers.
        self.campaign(change.campaign_id)
        payload = self._request(change.campaign_id, {"status": PAUSED_STATUS}, write=True)
        if payload.get("success") is not True:
            raise UncertainWrite("Meta did not confirm campaign pause")
        return self._verify_paused(change.campaign_id)

    def _verify_paused(self, campaign_id: str) -> dict[str, Any]:
        try:
            campaign = self.campaign(campaign_id)
        except (ProviderError, ValueError):
            raise UncertainWrite("Write sent but final state could not be verified") from None
        if campaign.status != PAUSED_STATUS:
            raise UncertainWrite("Write sent but paused state is not confirmed")
        return {"id": campaign.id, "verified_status": campaign.status}


class OfflineData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str
    account: Account
    campaigns: list[Campaign]
    insights: list[dict[str, Any]]


class OfflineProvider:
    """Local reference records. Writes are persisted by the shared proposal store."""

    def __init__(self, settings: Settings):
        self.data = OfflineData.model_validate_json(
            settings.offline_data_path.read_text(encoding="utf-8")
        )
        if self.data.source != "synthetic":
            raise ValueError("Offline data must explicitly identify its synthetic source")

    def close(self) -> None:
        return None

    def account(self) -> Account:
        return self.data.account

    def campaigns(self) -> list[Campaign]:
        return self.data.campaigns

    def campaign(self, campaign_id: str) -> Campaign:
        for row in self.campaigns():
            if row.id == campaign_id:
                return row
        raise ProviderError("Campaign not found in offline records")

    def insights(self, since: date, until: date) -> list[dict[str, Any]]:
        return [
            row
            for row in self.data.insights
            if date.fromisoformat(row["date_start"]) >= since
            and date.fromisoformat(row["date_stop"]) <= until
        ]

    def apply(self, change: Change) -> dict[str, Any]:
        return {
            "operation": change.operation,
            "status": PAUSED_STATUS,
            "remote_write": False,
            "source": "synthetic",
        }
