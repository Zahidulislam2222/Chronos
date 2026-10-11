"""Executable safety criteria; no real credentials or external requests."""

import json
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest
from pydantic import ValidationError

from chronos_ads.config import Settings
from chronos_ads.protocol import Change
from chronos_ads.provider import MetaProvider, ProviderError, UncertainWrite
from chronos_ads.service import AdsService
from chronos_ads.store import StateError, Store


@pytest.fixture
def settings(tmp_path):
    return Settings(state_db=tmp_path / "state.sqlite3")


@pytest.fixture
def service(settings):
    value = AdsService(settings)
    yield value
    value.close()


def approve(service, proposal_id):
    service.store.transition(proposal_id, "pending", "approved", time.time(), "test-owner")


def test_offline_source_metrics_and_no_revenue_claim(service):
    assert service.account()["source"] == "synthetic"
    assert service.account()["connected"] is False
    report = service.report("2026-10-01", "2026-10-07")
    assert report["currency"] == "USD"
    assert report["rows"][0]["ctr_percent"] == "2.00"
    assert report["rows"][0]["cpc"] == "0.175"
    assert report["rows"][1]["ctr_percent"] is None
    assert report["rows"][1]["cpc"] is None
    assert report["roas"] is None
    assert service.report("2026-10-08", "2026-10-09")["rows"] == []


@pytest.mark.parametrize(
    "start,end",
    [
        ("invalid", "2026-10-01"),
        ("2026-10-08", "2026-10-01"),
        ("2026-01-01", "2026-10-01"),
    ],
)
def test_invalid_report_range(service, start, end):
    with pytest.raises(ValueError):
        service.report(start, end)


@pytest.mark.parametrize(
    "values",
    [
        {"mode": "live"},
        {"meta_origin": "http://example.invalid"},
        {"meta_origin": "https://example.invalid/path"},
        {"meta_origin": "https://user:pass@example.invalid"},
        {"timeout_seconds": 0},
        {"max_pages": 0},
        {"mode": "something-else"},
    ],
)
def test_config_fail_closed(values):
    with pytest.raises(ValidationError):
        Settings(**values)


def test_env_file_paths_and_unknown_setting(tmp_path, monkeypatch):
    for key in list(__import__("os").environ):
        if key.startswith("CHRONOS_ADS_"):
            monkeypatch.delenv(key)
    env = tmp_path / ".env"
    env.write_text("CHRONOS_ADS_STATE_DB=state.sqlite3\nCHRONOS_ADS_WRITE_ENABLED=false\n")
    settings = Settings.load(env)
    assert settings.state_db == tmp_path / "state.sqlite3"
    assert settings.write_enabled is False
    monkeypatch.setenv("CHRONOS_ADS_UNRECOGNIZED", "1")
    with pytest.raises(ValidationError):
        Settings.load(env)


def test_pause_requires_approval_and_survives_restart(service, settings):
    proposal = service.propose("pause_campaign", campaign_id="100000001")["proposal"]
    with pytest.raises(StateError):
        service.execute(proposal["id"])
    assert proposal["document"]["before"]["status"] == "ACTIVE"
    assert proposal["document"]["after"]["status"] == "PAUSED"
    approve(service, proposal["id"])
    result = AdsService(settings)
    try:
        assert result.execute(proposal["id"])["proposal"]["state"] == "applied"
        assert result.campaigns()["campaigns"][0]["status"] == "PAUSED"
    finally:
        result.close()
    with pytest.raises(StateError):
        service.execute(proposal["id"])
    assert [row["event"] for row in service.store.events(proposal["id"])] == [
        "proposed",
        "approved",
        "executing",
        "applied",
    ]


def test_create_is_paused_budgetless_and_persistent(service, settings):
    proposal = service.propose("create_paused_campaign", name="Chronos awareness")["proposal"]
    assert "budget" not in json.dumps(proposal["document"]["after"])
    assert proposal["document"]["cost"]["new_spend_authorized"] is False
    approve(service, proposal["id"])
    service.execute(proposal["id"])
    reopened = AdsService(settings)
    try:
        campaign = reopened.campaigns()["campaigns"][-1]
        assert campaign["name"] == "Chronos awareness"
        assert campaign["status"] == "PAUSED"
        assert len(reopened.campaigns()["campaigns"]) == 3
    finally:
        reopened.close()


@pytest.mark.parametrize("operation", ["activate_campaign", "increase_budget", "delete_campaign"])
def test_spending_operations_absent(service, operation):
    with pytest.raises(ValidationError):
        service.propose(operation, name="Invalid")


def test_expiry_rejects_approval_and_execution(service):
    proposal = service.store.create({"scope": service._scope()}, time.time() - 100, 1)
    with pytest.raises(StateError, match="expired"):
        approve(service, proposal["id"])
    proposal = service.propose("create_paused_campaign", name="A")["proposal"]
    approve(service, proposal["id"])
    with pytest.raises(StateError, match="expired"):
        service.store.transition(
            proposal["id"],
            "approved",
            "executing",
            time.time() + service.settings.proposal_ttl_seconds,
            "executor",
        )


def test_atomic_claim_allows_one_winner(service):
    proposal = service.propose("create_paused_campaign", name="One")["proposal"]
    approve(service, proposal["id"])

    def claim():
        try:
            service.store.transition(proposal["id"], "approved", "executing", time.time(), "worker")
            return True
        except StateError:
            return False

    with ThreadPoolExecutor(max_workers=8) as pool:
        assert sum(pool.map(lambda _: claim(), range(8))) == 1
    with pytest.raises(StateError):
        service.execute(proposal["id"])


def test_account_configuration_change_invalidates_approval(service, settings):
    proposal = service.propose("create_paused_campaign", name="A")["proposal"]
    approve(service, proposal["id"])
    changed = AdsService(settings.model_copy(update={"api_version": "v99.0"}))
    try:
        with pytest.raises(StateError, match="configuration"):
            changed.execute(proposal["id"])
    finally:
        changed.close()


def live_settings(tmp_path, **overrides):
    return Settings(
        mode="live",
        meta_token="test-key",
        account_id="act_123",
        api_version="v99.0",
        meta_origin="https://meta.example.invalid",
        state_db=tmp_path / "live.sqlite3",
        **overrides,
    )


def account_response():
    return {"id": "act_123", "name": "Account", "currency": "USD", "timezone_name": "UTC"}


def campaign_response(**overrides):
    return {
        "id": "456",
        "name": "C",
        "status": "ACTIVE",
        "effective_status": "ACTIVE",
        "objective": "OUTCOME_AWARENESS",
        "account_id": "123",
        **overrides,
    }


def test_http_contract_token_header_and_cursor_not_next_url(tmp_path):
    requests = []

    def handle(request):
        requests.append(request)
        assert request.headers["Authorization"] == "Bearer test-key"
        assert "access_token" not in str(request.url)
        if "after" not in request.url.params:
            return httpx.Response(
                200,
                json={
                    "data": [campaign_response()],
                    "paging": {
                        "next": "https://evil.example.invalid/?access_token=do-not-follow",
                        "cursors": {"after": "cursor-1"},
                    },
                },
            )
        assert request.url.params["after"] == "cursor-1"
        return httpx.Response(200, json={"data": []})

    provider = MetaProvider(live_settings(tmp_path), httpx.MockTransport(handle))
    try:
        assert len(provider.campaigns()) == 1
        assert len(requests) == 2
        assert all(r.url.host == "meta.example.invalid" for r in requests)
    finally:
        provider.close()


def test_pagination_limit_never_returns_silent_partial_report(tmp_path):
    provider = MetaProvider(
        live_settings(tmp_path, max_pages=1),
        httpx.MockTransport(
            lambda _: httpx.Response(
                200,
                json={
                    "data": [],
                    "paging": {
                        "next": "unused",
                        "cursors": {"after": "more"},
                    },
                },
            )
        ),
    )
    try:
        with pytest.raises(ProviderError, match="limit"):
            provider.campaigns()
    finally:
        provider.close()


def test_cross_account_campaign_rejected(tmp_path):
    provider = MetaProvider(
        live_settings(tmp_path),
        httpx.MockTransport(
            lambda _: httpx.Response(200, json=campaign_response(account_id="999"))
        ),
    )
    try:
        with pytest.raises(ProviderError, match="belong"):
            provider.campaign("456")
        with pytest.raises(ValueError):
            provider.campaign("../other")
    finally:
        provider.close()


def test_live_write_flag_blocks_direct_adapter_calls(tmp_path):
    calls = []
    provider = MetaProvider(
        live_settings(tmp_path), httpx.MockTransport(lambda request: calls.append(request))
    )
    try:
        with pytest.raises(ProviderError, match="disabled"):
            provider.apply(Change(operation="create_paused_campaign", name="A"))
        assert calls == []
    finally:
        provider.close()


@pytest.mark.parametrize("failure", ["timeout", "server-error", "bad-json", "missing-id"])
def test_ambiguous_writes_never_retry(tmp_path, failure):
    writes = []

    def handle(request):
        if request.method == "GET":
            return httpx.Response(200, json=account_response())
        writes.append(request)
        if failure == "timeout":
            raise httpx.ReadTimeout("test-key must never escape", request=request)
        if failure == "server-error":
            return httpx.Response(503, text="test-key")
        if failure == "bad-json":
            return httpx.Response(200, text="test-key")
        return httpx.Response(200, json={"success": True})

    settings = live_settings(tmp_path, write_enabled=True)
    service = AdsService(settings, MetaProvider(settings, httpx.MockTransport(handle)))
    try:
        proposal = service.propose("create_paused_campaign", name="A")["proposal"]
        approve(service, proposal["id"])
        with pytest.raises(UncertainWrite) as error:
            service.execute(proposal["id"])
        assert "test-key" not in str(error.value)
        assert service.store.get(proposal["id"])["state"] == "uncertain"
        with pytest.raises(StateError):
            service.execute(proposal["id"])
        assert len(writes) == 1
        body = writes[0].content.decode()
        assert "status=PAUSED" in body
        assert "budget" not in body and "access_token" not in body
    finally:
        service.close()


def test_stale_campaign_fails_before_write(tmp_path):
    changes = {"name": "C"}
    writes = []

    def handle(request):
        if request.method == "POST":
            writes.append(request)
            return httpx.Response(200, json={"success": True})
        if request.url.path.endswith("act_123"):
            return httpx.Response(200, json=account_response())
        return httpx.Response(200, json=campaign_response(**changes))

    settings = live_settings(tmp_path, write_enabled=True)
    service = AdsService(settings, MetaProvider(settings, httpx.MockTransport(handle)))
    try:
        proposal = service.propose("pause_campaign", campaign_id="456")["proposal"]
        approve(service, proposal["id"])
        changes["name"] = "Changed after approval"
        with pytest.raises(StateError, match="changed"):
            service.execute(proposal["id"])
        assert writes == []
        assert service.store.get(proposal["id"])["state"] == "failed"
    finally:
        service.close()


def test_redaction_and_sql_binding(service, tmp_path):
    configured = AdsService(
        service.settings.model_copy(
            update={
                "meta_token": __import__("pydantic").SecretStr("test-key"),
                "state_db": tmp_path / "redact.sqlite3",
            }
        )
    )
    try:
        assert configured.clean({"name": "test-key"})["name"] == "[redacted]"
    finally:
        configured.close()
    with pytest.raises(StateError):
        service.store.get("' OR 1=1 --")
    assert Store(service.settings.state_db, 1).list_proposals() == []
