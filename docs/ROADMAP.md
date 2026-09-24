# Roadmap

Chronos is a working portfolio demo today. This roadmap takes it from a
single free-tier VM to a system designed for 1M+ concurrent users with
99.9% availability. It also covers what a real business would need before
selling real watches.

**No phase is claimed until its exit criteria are met with evidence.** Each
phase that costs money must be priced with current provider calculators and
approved before anything is provisioned.

## Phase 0: Done (September 2026)

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

## Phase 1: Operate the demo reliably (target: 99% measured)

Cost: small (some items may fit free tiers; verify before use).

| Work item | Exit criterion |
|---|---|
| Encrypted off-server backups to private object storage | Nightly DB + weekly uploads for 14 days; **one timed restore test passes** |
| External uptime monitoring every 60 s with alerts | 30 consecutive days of probe data with ≥ 99% coverage |
| Separate backend health probe (GraphQL + REST) | Backend outage detected while frontend HTML is still up |
| Restart the frontend container when its health check fails (autoheal watcher or orchestrator) | Induced unhealthy state recovers without manual action |
| Static backend IP and owned domain instead of sslip.io | Backend reachable at an owned hostname; old hostname redirected |
| Registrar auto-renew and expiry alerts | Documented in the private recovery record |
| Rotate any secret ever stored in a place that became public | Rotation recorded |
| Error-budget report | First monthly report published in VERIFICATION.md |

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

- Move the browser JWT out of script-readable storage (HttpOnly cookie with
  CSRF protection, or a backend-for-frontend).
- Versioned public API contract with a deprecation policy.
- Regenerate HTML snapshots automatically on publish (webhook → build).
- Reduce CSP `'unsafe-inline'` for styles.
- Resume Dependabot version-update PRs with grouped updates, and review the
  open stripe-php major upgrade (16 → 20).
- Automated browser end-to-end tests in CI against a disposable stack.
- WooCommerce product seed script for local development (from
  `src/content/catalogue.json`), so a fresh clone has a working connected
  catalogue.
- Faster local setup: batch the WP-CLI calls in `sample-data.sh` into one
  `wp eval-file` run.
