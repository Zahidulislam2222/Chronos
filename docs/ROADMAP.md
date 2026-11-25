# Roadmap

Chronos is a working storefront website today. This roadmap takes it from a
single existing VM to a system designed for 1M+ concurrent users with
99.9% availability. It also covers what a real business would need before
selling real watches.

**No phase is claimed until its exit criteria are met with evidence.** Each
phase that costs money must be priced with current provider calculators and
approved before anything is provisioned.

## Phase 0: Delivered foundations (September–November 2026)

- [x] Headless WordPress/WooCommerce backend with custom `chronos-bridge` and
      `chronos-blocks` plugins
- [x] Pre-rendered React storefront connected to live CMS data
- [x] Accounts, persisted contact inbox and **server-priced, idempotent Stripe
      test checkout**
- [x] Correct 404s for draft/missing routes; live sitemap
- [x] Hardened frontend container (read-only, non-root, resource limits, CSP,
      HSTS, request budget)
- [x] Local-first releases with SHA-256 local/live parity
- [x] CI on pushes to `main` and every pull request (PHP, blocks, frontend), dependency
      audits, CodeQL
- [x] Public documentation: architecture, API, deployment, security, threat
      model, compliance, scalability, availability

### Delivered in November 2026

- [x] Account-enumeration guards on every user-revealing route and uniform sign-in errors
- [x] GraphQL hardening: no debug output, analyzer or public introspection; depth limit
- [x] Health endpoints (`/chronos/v1/health`, `/chronos/v1/health/backup`) and a scheduled availability probe every 30 minutes with owner alerts
- [x] Nightly encrypted off-host backups, a timed restore into an isolated stack and a host-rebuild rehearsal (8 min 40 s from a clean OS)
- [x] Patched runtime images (0 high or critical findings) and clean npm audits
- [x] AI guide on zero-retention endpoints, refusal-aware spend reservations and automatic pause
- [x] Sign-in expiry handling, an honest payment return page and stable page layout
- [x] Protected `main`: pull requests, 10 required checks, administrators included

## Phase 1: Operate the website reliably (target: 99% measured)

Cost: small (some items may fit free tiers; verify before use).

| Work item | Exit criterion | Status on 25 November 2026 |
|---|---|---|
| Encrypted off-server backups | Nightly DB + uploads for 14 days; **one timed restore test passes** | Running nightly since 25 November (14 days kept); timed restore passed; 14-day run in progress |
| External uptime monitoring every 60 s with alerts | 30 consecutive days of probe data with ≥ 99% coverage | Probe every 30 minutes with owner alerts; 60 s interval and the 30-day window still open |
| Separate backend health probe (GraphQL + REST) | Backend outage detected while frontend HTML is still up | Done: backend health counts separately in the probe |
| Restart the frontend container when its health check fails (autoheal watcher or orchestrator) | Induced unhealthy state recovers without manual action | Open |
| Static backend IP and owned domain instead of sslip.io | Backend reachable at an owned hostname; old hostname redirected | Open |
| Registrar auto-renew and expiry alerts | Documented in the private recovery record | Open |
| Rotate any secret ever stored in a place that became public | Rotation recorded | Deferred by the operator until the current work is complete |
| Administrator multi-factor sign-in | Every administrator account requires a second factor | Deferred by the operator; risk recorded in the threat model |
| Stripe test webhook on the live backend | Signed `checkout.session.completed` marks orders paid without the buyer returning | Open: needs the operator's webhook secret |
| Error-budget report | First monthly report published in VERIFICATION.md | Open: needs 30 days of probe data |

## Phase 2: Scale to about 10k–100k concurrent users

Cost: moderate and recurring (managed database, cache, load balancer, CDN
features, monitoring).

| Work item | Exit criterion |
|---|---|
| Edge caching of anonymous HTML (hostname-scoped rules) | Measured edge hit ratio ≥ 95% for HTML in a load test |
| GraphQL reads over GET + persisted queries + tag-based purge (WPGraphQL Smart Cache) | Publishing a product purges only affected queries; stale window measured |
| Redis/Valkey persistent object cache | DB queries per request reduced; measured before/after |
| WooCommerce HPOS enabled and verified | Order read/write tests pass on HPOS tables |
| Media offloaded to object storage + CDN | App nodes hold no uploads |
| Stateless PHP tier: ≥ 2 nodes behind a load balancer | Losing one node causes no outage in a failure test |
| Managed MySQL with HA standby + 1 read replica | Failover test passes; replication lag monitored |
| WP-Cron replaced by system cron / workers | No cron work in user requests |
| Search service for catalogue filters | p95 search latency target met under load |
| **Distributed load test at 10k, then 100k** in an isolated environment | Latency and error targets met; results published with configuration |

## Phase 3: 1M+ concurrent users and 99.9%

Cost: significant and recurring. Needs a business case.

| Work item | Exit criterion |
|---|---|
| Multi-zone autoscaling app tier | Zone-failure test with no SLO breach |
| Multiple read replicas + connection pooling proxy | Sustains the measured read rate at 1M sessions |
| Queue-backed webhooks, emails and index updates | Spikes absorbed; no lost events in chaos tests |
| Stripe limit increase requested ≥ 6 weeks ahead; token-bucket client throttle | Checkout load test within provider limits |
| WAF, bot management, DDoS protection, per-route rate limits | Attack simulations blocked without harming real users |
| Observability: metrics, logs, traces, RUM, multi-region probes, on-call rota | Alerts reach a person within 5 min, 24/7 |
| Warm DR region with replica and backups | Region-failover drill meets RTO ≤ 4 h, RPO ≤ 5 min |
| **Distributed load test at 1M concurrent sessions** (with provider approval) | Sustained targets met; cost per 1k sessions measured |
| 30+ days at ≥ 99.9% measured | Published error-budget report |

## Real-commerce launch track (independent of scale)

Required before selling real products to real customers. See
[COMPLIANCE.md](COMPLIANCE.md).

| Work item | Exit criterion |
|---|---|
| Legal entity, trader identity, contact and complaint details | Shown on site and in order emails |
| Privacy programme: controller identity, lawful bases, retention schedule, processor contracts (hosting, CDN, Stripe), transfer mechanisms | Reviewed by qualified counsel |
| Consumer terms: distance-selling information, 14-day withdrawal (EU), legal guarantee, returns/refunds, shipping promises (FTC Mail Order Rule) | Reviewed by qualified counsel |
| Product safety (GPSR) and product-specific rules for the actual watches | Economic-operator roles and product data documented |
| PCI DSS self-assessment (SAQ A with hosted redirect) | Completed and filed with the acquirer |
| Tax: VAT/OSS, US sales tax nexus, duties | Configured and reviewed |
| Accessibility: manual WCAG 2.2 AA audit with assistive technologies | Audit report; issues fixed |
| Real-mode payments: live keys server-side only, webhook secret rotation, fraud controls (Stripe Radar) | Live-mode test transaction reconciled; refund flow tested |
| Security: external penetration test | Report; high and critical findings fixed |

## Engineering backlog (smaller items)

- Dependency parser replacements and regression guards were merged through the
  reviewed security release. Keep full audits and the 19 block tests active;
  re-run them against each new lockfile and generated-asset release.

- Narrow the AI guide's action guard: "send ... the contact form" is wrongly treated as an action request (1 of 13 evaluation tasks).
- Move the browser JWT out of script-readable storage (HttpOnly cookie with
  CSRF protection, or a backend-for-frontend).
- Versioned public API contract with a deprecation policy.
- Regenerate HTML snapshots automatically on publish (webhook → build).
- Reduce CSP `'unsafe-inline'` for styles.
- Resume Dependabot version-update PRs with grouped updates.
- Maintain the deployed Stripe SDK 20 cohort; every future dependency upgrade repeats
  native compatibility, immutable release, rollback and hosted test reconciliation.
- Automated browser end-to-end tests in CI against a disposable stack.
- WooCommerce product seed script for local development (from
  `src/content/catalogue.json`), so a fresh clone has a working connected
  catalogue.
- Faster local setup: batch the WP-CLI calls in `sample-data.sh` into one
  `wp eval-file` run.

## Integration rollout and maintainability track

Accountable maintainer/operator: Zahidul Islam. Business and legal launch work needs the responsible business owner and qualified advisers. Phase1 is required before an uptime commitment or commercial launch; each later stage follows funded scope and its measured exit. Unverified work blocks the corresponding claim, not preservation of the existing test-payment storefront.


| Stage | Current state / required exit |
|---|---|
| Storefront content/navigation | Deployed: five products with illustrative imagery, three complete articles, responsive pages, direction-aware header; browser/payment/hash evidence in VERIFICATION |
| Advertising tools | Local MCP/CLI behavior tested; connect the owner's Meta account and Claude host, verify read-only account scope, then separately approve a paused-only mutation |
| Inventory workflow | Private installed n8n, manually exercised complete catalogue flow; imported graph remains unpublished and queues private drafts |
| Inventory service upgrade | Review-discovered freshness, bounded-error and container fixes are in source; drift-check/back up installed state, deploy scoped files, restart and verify hashes/real manual flow before marking rollout complete |
| Dependency rollout | Completed SDK 20.3.1 immutable rollout, native rollback, parity and hosted test reconciliation; future SDK upgrades repeat these gates |
| External publication | Design actual destination adapters, OAuth/scopes, media contracts, review/approval, idempotency and takedown rules before enabling social writes |
| CI and handoff | Keep all package gates and secret scans active, use reviewed PRs and verified commit attribution; preserve project-local interruption checkpoints |

The business owner prioritizes each phase; the maintainer estimates implementation/testing effort; the operator approves recurring infrastructure and traffic costs. Dates follow funded scope and measured exits. Phase 1 establishes the 99% service objective; later scale stages increase capacity and resilience toward 1M+ simultaneous sessions and 99.9%.
