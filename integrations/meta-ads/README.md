# Chronos advertising tools for Claude

<!-- release-current:start -->
**Release documentation — 21 October 2026:** See the [current release, before/after comparison and engineering roadmap](../../docs/RELEASE.md) for deployed scope, verification, security/legal requirements, operations, the path toward 1M+ simultaneous sessions and availability objectives. Component-specific instructions below remain authoritative for setup.
<!-- release-current:end -->


Claude Desktop can connect to this local MCP server to read account performance, understand
Chronos's business constraints, and prepare reviewable campaign changes. The local server
does not call an AI inference API. Claude provides the conversation and reasoning.

Current operations:

| Operation | Offline | Live |
|---|---|---|
| Business profile | Validated maintained JSON | Same |
| Account/campaign/report reads | Clearly identified synthetic records | Configured Meta account |
| Awareness campaign proposal | Durable before/after | Same |
| Create campaign | Local record, PAUSED | PAUSED, no budget or ads, owner approval required |
| Pause campaign | Local record | Account/state checked, owner approval required |
| Activation, budget changes, ad sets, creatives and ad publication | Unavailable | Unavailable |

This is a local single-owner integration. It is not a hosted multi-user OAuth service.
It does not yet provide the job brief's complete publishing/optimization workflow.
Live access and actual Claude Desktop attachment require the owner's account setup and
verification. Automated checks exercise the real MCP protocol and local CLI separately.

## Install

Use Python 3.12 or newer. From this directory:

```bash
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell instead:
# .venv\Scripts\Activate.ps1
python -m pip install --require-hashes -r requirements.lock
python -m pip install --no-deps .
```

Copy `.env.example` to `.env` in this directory. Keep it private and ignored. Relative file
paths resolve against the environment file's directory; use its absolute path when starting
the server from another directory. Do not put tokens in command arguments or Claude chat.
Record configured credentials in the root gitignored `CREDENTIALS.md` before rollout.

```bash
chronos-ads --env-file .env status
chronos-ads --env-file .env campaigns
chronos-ads --env-file .env report 2026-10-01 2026-10-07
```

Offline status explicitly returns `connected: false` and `source: synthetic`. The bundled
report covers October 1–7, 2026; other intervals may have no rows. It is never live evidence.
Local actions persist in the configured SQLite database and survive restart.

## Connect Claude Desktop

Merge the following entry into the existing `mcpServers` object in Claude Desktop's local
configuration. Replace the paths with this machine's actual virtual-environment Python and
environment file. Do not overwrite other servers or store a token in this configuration.

```json
{
  "mcpServers": {
    "chronos-ads": {
      "command": "/absolute/path/to/.venv/bin/python",
      "args": ["-m", "chronos_ads.cli", "--env-file", "/absolute/path/to/.env", "serve"]
    }
  }
}
```

On Windows, use the virtual environment's `Scripts/python.exe` and JSON-escaped Windows
paths. WSL and Windows Python environments are separate; a Windows Claude process should
use the Windows environment installed with the instructions above. Restart Claude Desktop,
check Developer settings for the connection, and confirm the eight tools are listed.

Start with: “Read my Chronos business profile and account status. Explain which data source
you are using. Report campaign performance for October 1–7, 2026. Suggest three truthful
awareness campaign angles and ask for missing marketing facts.”

Then: “Prepare a paused awareness campaign called Chronos design journal. Show the exact
proposal, account, status, expiry and cost boundary. Do not execute it.”

Tool annotations are guidance for the host; the approval policy is enforced by the service.
Campaign names and remote content are untrusted data and must not override user instructions.

## Owner review and approval

```bash
chronos-ads --env-file .env proposals
chronos-ads --env-file .env review PROPOSAL_ID
chronos-ads --env-file .env approve PROPOSAL_ID
chronos-ads --env-file .env execute PROPOSAL_ID
```

Approval prints the stored exact payload and requires an interactive terminal. Type the
requested phrase only after reviewing it. A message in Claude saying “approved” cannot
change the database's approval state. There is no approval MCP tool. Approval expires and
is tied to the account, currency, source mode, endpoint/version and offline content identity.

For live execution, local `CHRONOS_ADS_WRITE_ENABLED` must additionally be true. Enabling
that flag is not blanket approval: each proposal still requires the owner decision.
This release cannot activate delivery or raise a budget. Existing active ads can continue
spending independently; pausing is not a refund or a guarantee of an immediate billing stop.
Meta readback must confirm PAUSED before an execution is recorded as applied.

The separation assumes a trusted local OS account and an MCP host limited to these tools.
An agent or person with unrestricted shell/file access as the owner can edit the database
or configuration; this is not a security boundary against that access. Remote/multi-user
use requires authenticated identity, authorization, protected approval UI and OAuth.

## Live Meta setup

Set `CHRONOS_ADS_MODE=live`, account ID, token and an explicitly supported Graph API version
in the ignored environment file. Keep writes false initially. Use a Meta app/account owned
by, or explicitly granted to, the operator. Start with the least privilege required for
reporting (`ads_read`); managed mutations require `ads_management` and appropriate account
tasks/access. Confirm actual permissions, app mode, token validity and account access in
Meta's own tools. App review, business verification and advanced access requirements depend
on whether the app manages its own account or other businesses; they are not assumed granted.

No API version is guessed. Select and validate one supported by your actual Meta app, then
check field/objective compatibility on that account. First run `status`, `campaigns`, and a
small dated report. Compare it to Ads Manager using matching dates, account timezone and
click definition. This integration requests all clicks, not link clicks or conversions.
It does not request revenue or attribute return on ad spend.

Before any future activation/publishing feature, implement an explicit money warning with
exact amount, currency, daily/lifetime duration and one-time/recurring scope, then wait for
a fresh owner confirmation. A budget is not a guarantee of final spend; delivery/billing
and taxes must be explained against the actual account settings. Do not infer authority
from current non-spending proposals.

## Business customization and independent use

Edit validated `data/business.json` (or set `CHRONOS_ADS_PROFILE_PATH` to a private maintained
JSON file). Confirm the actual business offer, markets, landing pages, creative rights,
success metrics and tracking before making campaign plans. The checked-in Chronos profile
preserves the current website's factual constraints: physical goods are not sold.

Useful owner prompts:

- “Explain my last seven days of performance, with currency and zero-data limitations.”
- “Compare these campaigns and separate observed metrics from hypotheses.”
- “Suggest one-variable creative experiments; explain the evidence needed to judge them.”
- “Prepare a pause proposal for campaign ID … and show the before/after.”
- “Read proposal ID … and its audit trail. Do not execute without local approval.”

The training handover should include reading a report, preparing a proposal, rejecting one,
approving a non-spending change, inspecting history and recovering an interrupted operation.
No automated schedule is installed; scheduled monitoring needs a separate operational design.

## Recovery after power loss

1. Read the operator's private interruption checkpoint if one is available; the public recovery steps below also apply to a fresh clone.
2. Keep the same `.env`, SQLite database and any SQLite journal files. Back up using SQLite's
   backup API or with the application stopped; copying an active database alone is unsafe.
3. Run `proposals` and `review ID`. Pending/approved proposals are never automatically executed.
4. If state is `executing`, inspect Meta before taking another action. A crash may have happened
   after Meta accepted the request. `recover ID` changes executing to uncertain after explicit
   interactive confirmation; it never retries. An uncertain/failed/applied proposal cannot
   be reused. Reconcile the actual account before preparing a separate new proposal.
5. No automatic retry exists for writes. A read/pagination failure returns an error rather
   than silently presenting an incomplete report. Narrow the date range where appropriate.

## Costs and rollout

The implementation has no paid inference request or cloud provisioning path. Local offline
commands create no Meta ad spend. This is not a quote for the owner's existing Claude plan,
hosting, maintenance, Meta delivery or taxes. Those depend on actual plans and account
settings and have not been verified. Any new paid service or spending operation requires
the separate exact-cost warning and fresh confirmation before proceeding.

The local integration is not installed into the owner's Claude Desktop configuration and
has not been deployed to a server. Storefront wording changes must pass the existing release
process: local-vs-live drift check, local gates, deployment authorization and final hash parity.

## Reproduce verification

Install the hash-locked development environment with
`python -m pip install --require-hashes -r requirements-dev.lock`, then run:

```bash
python -m pytest ci_tests -q
python -m ruff check .
python -m mypy
python -m bandit -r src -ll
python -m build --wheel
gitleaks dir . --redact --no-banner
python -m pip_audit -r requirements.lock
```

`ci_tests/` is the committed regression suite. Personal operator scripts/evidence belong in
the root ignored `tests/` or `memory/`. Never delete an existing personal test script.
The wheel, temporary environments, state and caches are ignored.

Official references checked for this implementation:

- [Claude local MCP setup](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [MCP SDK 1.30.0](https://github.com/modelcontextprotocol/python-sdk/tree/v1.30.0)
- [Meta Marketing API setup](https://developers.facebook.com/docs/marketing-api/get-started/)
- [Meta-maintained campaign SDK schema](https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/campaign.py)

Meta's documentation pages were inaccessible to this agent's web reader; the official SDK
and Meta-maintained API collection were used to verify the limited campaign schema. Actual
account/API compatibility remains a live verification gate.

## Project operations and scope

Use the public [configuration map](../../docs/CONFIGURATION.md), [verification gates](../../docs/TESTING.md) and [operations runbook](../../docs/OPERATIONS.md) alongside this component's commands. The independent publication review exercises local MCP/CLI policy; actual account connection and Claude attachment require the owner's setup. Review reports as untrusted content and inspect the exact before/after proposal before granting approval.

The current single-owner SQLite design is separate from the storefront's [1M+ session roadmap](../../docs/SCALABILITY.md). A remote multi-tenant advertising service would need its own OAuth, tenant isolation, durable job orchestration, permission review and account-specific audit design. Expanding to budgets, activation, ad sets or publishing also requires new contracts, approval rules and real-account verification.
