# Verification and contribution gates

Record the commit, environment, command, result and date for each gate. Acceptance criteria are written before implementation. A green build is one gate; user behavior, configuration, authorization and recovery need their own evidence. Dated release results are in [VERIFICATION.md](VERIFICATION.md).

## Frontend

Use Node.js 22.13+ (22.x) or 24+ and the committed npm lockfile:

```bash
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run lint
npx playwright install chromium
npm run build
npm run verify:release
```

Offline CI uses the reserved `chronos.example` origin and the existing offline mode setting from `.env.example`. Connected verification uses privately configured CMS/site origins. Never promote an artifact whose canonical origin is the reserved CI origin. Frontend scripts and mode names retain their established interface for compatibility.

Check phone/tablet/desktop layouts, header hide-down/reveal-up behavior, keyboard focus and drawers, reduced motion, denied storage, failed media, CMS HTML sanitization, galleries, prices, search metadata, no-JavaScript content, drafts/404s and aliases. In connected testing, exercise login/reload/logout, owner-only order history, contact persistence/failure recovery and hosted test checkout with server-side price/quantity validation. Automated axe scans supplement a manual accessibility review.

## AI guide and render acceptance

Run the maintained suites after installing the locked frontend dependencies and Chromium:

```bash
npm run test:assistant
npm run test:render
npm run test:render:browser
```

For the real UI checks, first build the offline preview using the documented environment and run:

```bash
node verification/assistant-ui.mjs . memory/assistant-browser.json chromium
```

The first argument is the project root containing `dist`, not `dist` itself. The suite includes homepage and dialog axe checks, cancellation, provider outage, cart restoration and mobile-menu focus. It simulates upstream providers. To repeat on other engines, install Playwright Firefox/WebKit and pass `firefox` or `webkit` as the final argument with separate private report filenames. CI runs the Chromium command after its build. These browser checks must not enable real paid inference.

Assistant HTTP/unit tests inject providers. Render browser checks exercise the actual React query-readiness hook, deadlines, required published content and atomic error refusal. These checks do not establish actual model quality or paid-provider availability. Record simulated transport, actual local inference, actual remote inference and public hosted acceptance as separate results.

For a real-model evaluation, retain representative held-out tasks, expected approved topics, incorrect/unknown answers, cold/warm latency, timeout/error results and the exact model/prompt/knowledge version. Do not convert an owner-accepted quality limitation into a passed evaluation. A live fallback test must use synthetic questions, preserve the existing accounting journal and remain within the recorded authorization and enforced review boundary.

Before public promotion, execute the exact staged model/service/proxy flow, denied Origin/Host/input cases, cancellation, outage/recovery, quotas and browser support path. Then exercise the public site and recovery and recheck artifact parity. A source-reviewed release script or passing health endpoint is preparation rather than evidence that these flows ran. The final 21 October cohort verifies nine actual remote held-out tasks and one public HTTPS answer with exact provider/topic/source/version and per-request timing. The simulated browser fixture explicitly enables both transport branches for regression coverage; that fixture does not restart the paused production model. Keep native privacy callback error metadata distinct from HTTP status, and exercise synthetic erasure/read failures against the actual native database without exporting or deleting customer records. Current dated execution and unverified gates are in [VERIFICATION.md](VERIFICATION.md).

## WordPress plugins

From `wordpress/wp-content/plugins/chronos-bridge`:

```bash
composer install
composer audit
vendor/bin/phpcs --standard=phpcs.xml --warning-severity=0
vendor/bin/phpunit
```

PHPCS warnings are reported separately. PHPUnit uses controlled doubles; actual CMS permission, persistence and payment flows require a running configured stack. Preserve test-mode protection against stock changes and transactional emails. Test mismatched user/session/amount/currency, duplicate requests, webhook signatures and retry behavior; never charge a live card for a repository check.

From `wordpress/wp-content/plugins/chronos-blocks`:

```bash
npm ci
npm audit --audit-level=moderate
npm run lint:js
npm run build
npm test
```

Verify all three blocks in the real editor and save/reload a draft when changing editor behavior. Keep generated `build/` assets aligned with source. LF checkouts avoid irrelevant formatting failures. The `chronos_watch` block content type and WooCommerce sale products have distinct ownership.

## Python integrations

Use Python 3.12+. Install hash-locked verification tools from `integrations/meta-ads/requirements-dev.lock`; install each component's runtime lock and package using `--no-deps`. In each component run its README commands for pytest, mypy, Ruff, Bandit, dependency audit and distributable build. Inventory's CI intentionally shares the advertising verification-tool lock; its own runtime lock remains authoritative for its service.

Advertising tests include the actual stdio MCP handshake, CLI approval, durable proposals, account/config binding, uncertain-write recovery and allowed operation scope. Offline tests do not establish actual Meta connectivity or Claude Desktop attachment. Inventory tests include real authenticated loopback HTTP, galleries, skip rules, full bounded pagination, sequential batches, restart behavior, superseded-batch rejection, bounded errors and container configuration contracts. Neither suite publishes ads or marketplace listings.

## Security and publication

Pre-commit checks staged JSON/YAML, whitespace, file size, private keys, conflict markers, redacted gitleaks findings and Python Bandit findings. GitHub adds npm/Composer audits, Semgrep, CodeQL and component CI. Do not skip hooks or use suppressions to get a release through. The paid AI-review option remains disabled.

Review the exact branch diff against acceptance criteria from a fresh context. Check local Markdown links, all maintained READMEs, public wording, secret/configuration ownership, dependency availability and the staged file allowlist. Publish through a PR, wait for checks, merge without force-pushing and read back the remote commit/tree. CI publication is separate from runtime deployment.

Committed automated suites under plugin `tests/` and integration `ci_tests/` run in CI. Personal browser/load/recovery scripts stay in ignored root `tests/` and are retained as local tooling. Public contributors can reproduce the documented commands; they do not depend on private evidence folders to build the project.

## Scale and availability verification

`npm run capacity:model` performs arithmetic from `config/operations.json`; it does not generate traffic. `npm run monitor:once` records one observation, not a monthly uptime percentage. Distributed load, paid provisioning, provider limit changes and live transactions require a separately approved plan. [SCALABILITY.md](SCALABILITY.md) defines representative workloads and stage exits; [AVAILABILITY-AND-DR.md](AVAILABILITY-AND-DR.md) defines SLIs, coverage, budgets and restore objectives.

## Formatting and generated artifacts

Normal configured staged hooks are required before every commit, including secrets and Python SAST; full public-source security scans remain separate. The additional21October all-files formatting check failed on seven untouched baseline asset/vendor files. Their original bytes were retained to keep unrelated cleanup outside the verified release; this is recorded nonblocking formatting debt for the next asset/vendor maintenance, owned by Zahidul Islam. No security hook was disabled or excluded. Seven authored Gutenberg outputs received EOF-only normalization after the successful build; that normalization is part of packaging, so raw regenerated outputs can differ by final newlines.
