"""Configuration/credential regressions and actual MCP/CLI flows."""

import asyncio
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from chronos_ads.config import Settings

ROOT = Path(__file__).resolve().parents[1]


def test_environment_contract_and_no_provider_hardcoding():
    declared = set(
        re.findall(r"^CHRONOS_ADS_([A-Z_]+)=", (ROOT / ".env.example").read_text(), re.M)
    )
    assert declared == {field.upper() for field in Settings.model_fields}
    source = ROOT / "src/chronos_ads"
    for path in source.glob("*.py"):
        text = path.read_text()
        assert not re.search(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", text)
        assert not re.search(r"(?:sk-ant-|EAAB)[A-Za-z0-9_-]{20,}", text)
        if path.name != "config.py":
            assert not re.search(r"https?://|v[0-9]+\.[0-9]+|/mnt/[a-z]/|[A-Z]:\\", text)
            assert not re.search(r"os\.(?:environ|getenv)", text)
    service = (source / "service.py").read_text()
    assert "OUTCOME_AWARENESS" not in service
    assert "timeout=" not in service


def subprocess_env(tmp_path):
    env = {k: v for k, v in os.environ.items() if not k.startswith("CHRONOS_ADS_")}
    env["PYTHONPATH"] = str(ROOT / "src") + os.pathsep + env.get("PYTHONPATH", "")
    env["CHRONOS_ADS_STATE_DB"] = str(tmp_path / "flow.sqlite3")
    return env


def test_real_cli_propose_review_and_approval_requires_terminal(tmp_path):
    env = subprocess_env(tmp_path)
    command = [sys.executable, "-m", "chronos_ads.cli"]
    created = subprocess.run(
        [*command, "propose-create", "Chronos journal"],
        env=env,
        capture_output=True,
        text=True,
        check=True,
    )
    proposal = json.loads(created.stdout)["proposal"]
    reviewed = subprocess.run(
        [*command, "review", proposal["id"]], env=env, capture_output=True, text=True, check=True
    )
    assert json.loads(reviewed.stdout)["proposal"]["state"] == "pending"
    rejected = subprocess.run(
        [*command, "approve", proposal["id"]], env=env, capture_output=True, text=True, check=False
    )
    assert rejected.returncode == 2
    assert "interactive terminal" in rejected.stderr


def test_real_stdio_mcp_tools_and_policy(tmp_path):
    async def exercise():
        parameters = StdioServerParameters(
            command=sys.executable,
            args=["-m", "chronos_ads.cli", "serve"],
            env=subprocess_env(tmp_path),
        )
        async with stdio_client(parameters) as (read, write):
            async with ClientSession(read, write) as session:
                initialized = await session.initialize()
                assert initialized.serverInfo.name == "Chronos Ads"
                tools = (await session.list_tools()).tools
                names = {tool.name for tool in tools}
                assert names == {
                    "get_business_profile",
                    "get_ad_account",
                    "list_campaigns",
                    "get_campaign_insights",
                    "propose_paused_campaign",
                    "propose_pause_campaign",
                    "get_proposal",
                    "execute_approved_proposal",
                }
                assert not any("approve" == name or "budget" in name for name in names)
                account = await session.call_tool("get_ad_account", {})
                assert account.structuredContent["connected"] is False
                report = await session.call_tool(
                    "get_campaign_insights",
                    {
                        "since": "2026-10-01",
                        "until": "2026-10-07",
                    },
                )
                assert len(report.structuredContent["rows"]) == 2
                created = await session.call_tool("propose_paused_campaign", {"name": "A"})
                proposal = created.structuredContent["proposal"]
                blocked = await session.call_tool(
                    "execute_approved_proposal",
                    {
                        "proposal_id": proposal["id"],
                    },
                )
                assert "error" in blocked.structuredContent
                invalid = await session.call_tool(
                    "get_campaign_insights",
                    {
                        "since": "bad",
                        "until": "bad",
                    },
                )
                assert "error" in invalid.structuredContent

    asyncio.run(asyncio.wait_for(exercise(), timeout=30))
