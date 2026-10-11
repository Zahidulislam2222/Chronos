"""Final remote-state confirmation and no-success-on-unknown outcomes."""

import time

import httpx
import pytest

from chronos_ads.config import Settings
from chronos_ads.protocol import Change
from chronos_ads.provider import MetaProvider, UncertainWrite
from chronos_ads.service import AdsService


@pytest.mark.parametrize("confirmed", [True, False])
def test_remote_create_readback_controls_applied_state(tmp_path, confirmed):
    requests = []

    def handle(request):
        requests.append(request)
        if request.method == "POST":
            return httpx.Response(200, json={"id": "456"})
        if request.url.path.endswith("act_123"):
            return httpx.Response(
                200,
                json={
                    "id": "act_123",
                    "name": "A",
                    "currency": "USD",
                    "timezone_name": "UTC",
                },
            )
        return httpx.Response(
            200,
            json={
                "id": "456",
                "name": "Campaign",
                "account_id": "123",
                "status": "PAUSED" if confirmed else "ACTIVE",
                "effective_status": "PAUSED",
                "objective": "OUTCOME_AWARENESS",
            },
        )

    settings = Settings(
        mode="live",
        meta_token="test-key",
        account_id="act_123",
        meta_origin="https://meta.example.invalid",
        api_version="v99.0",
        write_enabled=True,
        state_db=tmp_path / "state.sqlite3",
    )
    service = AdsService(settings, MetaProvider(settings, httpx.MockTransport(handle)))
    try:
        assert service.business()["connected"] is False
        assert service.account()["connected"] is True
        proposal = service.propose("create_paused_campaign", name="Campaign")["proposal"]
        service.store.transition(proposal["id"], "pending", "approved", time.time(), "test-owner")
        if confirmed:
            result = service.execute(proposal["id"])["proposal"]
            assert result["state"] == "applied"
            assert result["result"]["verified_status"] == "PAUSED"
        else:
            with pytest.raises(UncertainWrite):
                service.execute(proposal["id"])
            assert service.store.get(proposal["id"])["state"] == "uncertain"
        assert sum(r.method == "POST" for r in requests) == 1
    finally:
        service.close()


def test_post_write_read_failure_is_uncertain(tmp_path):
    def handle(request):
        if request.method == "POST":
            return httpx.Response(200, json={"id": "456"})
        raise httpx.ConnectError("test-key", request=request)

    settings = Settings(
        mode="live",
        meta_token="test-key",
        account_id="act_123",
        meta_origin="https://meta.example.invalid",
        api_version="v99.0",
        write_enabled=True,
        state_db=tmp_path / "state.sqlite3",
    )
    provider = MetaProvider(settings, httpx.MockTransport(handle))
    try:
        with pytest.raises(UncertainWrite, match="could not be verified"):
            provider.apply(Change(operation="create_paused_campaign", name="Campaign"))
    finally:
        provider.close()
