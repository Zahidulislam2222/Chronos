# Availability, Monitoring, Incident Response and Disaster Recovery

**Status:** Chronos has a **99% availability objective**. It has no measured
uptime record and no SLA. This document defines how availability is measured,
the current failure domains, and what is required for
99% and then 99.9%.

## Service level objectives

| SLI (what is measured) | Definition | Objective |
|---|---|---|
| Availability | Share of scheduled external probes (every 30 minutes today; 60 seconds is the target) where `/`, `/shop`, `/healthz` and the backend health endpoint return HTTP 200 with the expected text within 10 s (`config/operations.json`) | **99%** per rolling 30 days (phase 1) → **99.9%** (phase 3) |
| Latency | p95 time to first byte of cached HTML from the probe regions | Target to be set from the first 30 days of real data |
| Checkout correctness | Share of paid Stripe sessions reconciled to a paid WooCommerce order | 100%; any mismatch is an incident |

Missing probe intervals count as **unknown, not up**. Coverage is reported
next to the percentage. A provider's uptime is not the application's uptime.

### Error budgets

| Objective | Allowed downtime per 30 days | Per year |
|---|---|---|
| 99% | 7 h 12 min | ~3.65 days |
| 99.5% | 3 h 36 min | ~1.83 days |
| 99.9% | 43 min 12 s | ~8.8 hours |
| 99.95% | 21 min 36 s | ~4.4 hours |
| 99.99% | 4 min 19 s | ~53 minutes |

Policy: when the 30-day budget is spent, feature releases stop. Only
reliability fixes ship until the budget recovers.

## What the current topology can achieve

| Fact | Consequence |
|---|---|
| One frontend origin, one backend VM, database on that VM | Any host failure is a full outage for dynamic features |
| Provider infrastructure commitments are separate from application SLIs | They do not measure WordPress, MySQL, TLS, release correctness or business-flow availability |
| Ephemeral IP behind the sslip.io hostname | Stopping the VM changes the backend address. It must not be stopped |
| Nightly encrypted off-host backup since 25 November 2026 (see below) | A disk loss loses at most about one day of data; a host rebuild takes about 9 minutes plus VM creation, TLS and the address change |
| Pre-rendered frontend HTML | The storefront shell and editorial snapshots can still load while the backend is down; live catalogue, login and checkout cannot |

The initial 99% objective requires external monitoring, alert ownership and
verified restore procedures. Independent origins and multi-zone stateful
services are engineering requirements for the later 99.9% stage in the
[roadmap](ROADMAP.md). Neither objective has a continuous reporting window yet.

## Monitoring

Available now:

- **Scheduled external probe** (`.github/workflows/availability.yml`, every
  30 minutes on GitHub-hosted runners): storefront `/`, `/shop`, `/healthz`
  and backend `/wp-json/chronos/v1/health` count toward availability;
  `/wp-json/chronos/v1/health/backup` is an owner alert that does not count
  as downtime. One delayed retry separates a blip from an outage. A failed
  run notifies the repository owner through GitHub; annotations label it as
  storefront downtime or an owner-only alert. A 30-minute interval cannot
  measure 99% precisely; it detects sustained outages.
- `npm run monitor:once` checks the configured paths and appends a
  timestamped JSON line. It exits non-zero on failure.
- The frontend container has a Docker health check on `/healthz` and
  `restart: unless-stopped`. The health check only reports status: plain
  Docker restarts the container when the process exits, not when it is
  unhealthy. Acting on health status needs an orchestrator or an autoheal
  watcher (planned in Phase 1 of the roadmap).
- `/healthz` on the frontend returns `chronos-ok`.

Required to actually measure 99%:

1. Run the probe **every 60 s from at least one independent location**, not
   the origin itself and not a laptop that sleeps.
2. Alert a person after 2 consecutive failures.
3. Probe the backend separately (GraphQL query + `/wp-json/chronos/v1/site`),
   so a backend outage is not hidden by cached frontend HTML.
4. Keep 30+ days of results, and report availability and coverage together.

At scale, add: multi-region synthetic probes, real-user monitoring, metrics
(request rate, errors, duration; CPU, memory, saturation), structured logs,
distributed tracing, database replication lag, queue depth, and Stripe error
rate.

## Incident response

| Severity | Examples | Response |
|---|---|---|
| **SEV-1** | Site down; checkout records wrong amounts; data exposure; credential leak | Immediate; stop releases; fix or roll back; notify affected parties if required |
| **SEV-2** | Checkout or login down; backend down but storefront shell up; error rate above budget burn | Same day |
| **SEV-3** | Degraded page, single broken route, non-critical admin feature | Next working day |

Steps for every incident:

1. **Detect** (probe alert, user report, security report).
2. **Stabilise**: roll back to the previous release, fail over, or put the
   affected feature into offline mode (`VITE_STOREFRONT_MODE=preview` stops
   all external mutations).
3. **Preserve evidence** privately: logs, before-state, timestamps.
4. **Fix locally**, run the gates, deploy with parity proof
   ([DEPLOYMENT.md](DEPLOYMENT.md)).
5. **Notify** where the law or contracts require it. Under the GDPR, where
   it applies, a controller notifies the supervisory authority of a personal
   data breach **within 72 hours** of becoming aware, unless the breach is
   unlikely to risk people's rights and freedoms (Art. 33), and informs
   affected people when the risk is high (Art. 34). See
   [COMPLIANCE.md](COMPLIANCE.md).
6. **Post-incident review** within 5 working days: timeline, root cause,
   what gate should have caught it, the gate added. Defects that escaped go
   into [DEFECT-LOG.md](../DEFECT-LOG.md).

There is no staffed 24/7 on-call today. That is a phase 3 requirement.

## Backups

### Current state

- **Nightly encrypted off-host copy** ([deploy/backup](../deploy/backup/README.md)):
  at 03:17 UTC the frontend VPS pulls a consistent database dump, uploads,
  `wp-config.php` and the nginx site, encrypted on the backend to an OpenPGP
  key whose private half only the owner holds. 14 days are kept. The backend
  accepts an acknowledgement only for the exact archive it produced, and the
  health probe alerts when the last acknowledged copy is older than 30 hours.
- **Restore drill, 24-25 November 2026:** the first archive (1.1 MB) was
  decrypted on the owner workstation, every file verified against its
  manifest, and restored into an isolated MariaDB 10.6 + WordPress with no
  outbound network. Catalogue, pages, posts and the account guards worked and
  record counts matched production. Data restore to a verified application
  took about 67 seconds once a database engine existed.
- **Host rebuild rehearsal, 25 November 2026:** a clean Ubuntu 22.04 container
  (the production OS, PHP 8.1, MariaDB 10.6, nginx 1.18, WP-CLI 2.12.0) ran
  `scripts/gcp-setup.sh`, restored the same archive, installed the plugins at
  the live versions, then lost network access and was checked: health `ok`,
  GraphQL served 5 products and 3 posts, counts matched production and the
  users route answered 401. **8 min 40 s** from a clean OS to a verified
  backend: packages 50 s, setup script 75 s, decrypt 1 s, data restore 9 s,
  plugin install 6 min 18 s, checks 7 s.
- The rehearsal found and fixed two faults in the setup script: it added a
  second PHP-FPM pool on the default pool's socket, so PHP-FPM could not
  start, and it always downloaded the newest WordPress. It now tunes the
  default pool, matching production, and takes `CHRONOS_WP_VERSION` from the
  `wordpress <version>` line of the backup MANIFEST.
- **Plugin code is not in the backup.** A rebuild installs the
  wordpress.org plugins at the versions running in production
  (`wp plugin install <slug> --version=<v> --force --skip-plugins`) and copies
  WPGraphQL for WooCommerce 0.19.0, WPGraphQL JWT Authentication 0.7.0,
  WPGraphQL CORS 2.1 and the two Chronos plugins from the repository and the
  owner's copies. Without `--force`, three installs were skipped silently,
  so check every plugin folder after installing.
- Not yet measured: creating the replacement VM, issuing TLS, and pointing the
  storefront at a new backend address (the sslip hostname follows the IP), so
  the end-to-end RTO is the rehearsal time plus those steps. The old weekly
  Actions-artifact workflow stays disabled because this repository is public.

### Target design

| Item | Phase 1 (single VM) | Phase 3 (at scale) |
|---|---|---|
| Database | Nightly `wp db export`, compressed, **encrypted before leaving the host**, stored in private object storage in another region | Managed MySQL with point-in-time recovery plus daily snapshots copied cross-region |
| Uploads/media | Weekly archive + daily incremental to the same private bucket | Media already lives in object storage with versioning and cross-region replication |
| Retention | 30 daily + 12 weekly; bucket versioning + lifecycle rules | Per the data-retention policy in [COMPLIANCE.md](COMPLIANCE.md) |
| Access | Write-only credentials on the server; restore credentials held separately | Same, via a secrets manager with audit logs |
| Proof | **Quarterly restore test** into an isolated environment, timed and recorded | Monthly automated restore test |

A backup that has never been restored is not a backup.

### Recovery objectives

| Objective | Today | Phase 1 target | Phase 3 target |
|---|---|---|---|
| **RPO** (max data loss) | ≤ 24 h by design (nightly copy; alert after 30 h) | 24 h | ≤ 5 min (PITR) |
| **RTO** (time to restore service) | Host rebuild from a clean OS ~9 min measured (rehearsal); VM creation, TLS and the address change unmeasured | 4 h | ≤ 15 min (zone failover), ≤ 4 h (region loss) |

## Disaster scenarios

| Scenario | Today | Mitigation / runbook |
|---|---|---|
| Bad frontend release | Previous immutable release kept | Switch back to the previous release directory; verify hashes and `/healthz` |
| Bad plugin release | Immutable backend release directories selected by `content/runtime.php` | `release.sh rollback` switches back atomically (drill: about 8 s, no PHP-FPM reload); re-hash local vs live |
| Backend VM lost | Full dynamic outage; at most a day of data lost | Rebuild from `scripts/gcp-setup.sh` (with `CHRONOS_BACKEND_DOMAIN` and `CHRONOS_WP_VERSION` set), restore the latest archive, install plugins at the production versions (see backup state above), re-issue TLS, update the hostname if the IP changed |
| Backend IP changes | Hostname and frontend config break | Avoid stopping the VM; target: static IP + owned domain |
| Database corruption / bad migration | No PITR | Restore latest dump into a copy, verify, then switch |
| Domain or hosting expiry | **Happened in 2026**: the original domain and cPanel hosting expired | Registrar auto-renew, expiry alerts, and DNS documented in the private recovery record |
| CDN outage | Frontend unreachable through the proxy | Documented DNS-only fallback, with the security trade-offs noted |
| Stripe outage | Checkout unavailable | Checkout reports unavailable; nothing is charged; no order is marked paid without verification |
| Credential leak | — | Rotate the secret, review access logs, assess notification duties, record the incident |
| Region outage | Full outage | Phase 3: warm DR region with replica and backups |

## Business-flow SLIs and budget decisions

Report frontend delivery, anonymous CMS reads, sign-in, persisted contact submission and test checkout separately. A cached homepage cannot establish API or checkout availability. Monitor payment reconciliation exceptions and webhook backlog as correctness/freshness signals. Automation reports should include source-sync success, pending batch age, oldest queue item and uncertain advertising proposals; they are separate from the visitor SLO.

The proposed measurement policy includes planned maintenance, distinguishes user-visible failures from expected validation/client errors, and publishes unknown probe intervals and coverage. Version any change to success predicates, regions, thresholds or exclusions. Use both short-window and long-window burn alerts to detect rapid outages and gradual budget loss; threshold selection follows a measured baseline and operator coverage. The current script is a single-observation tool, not an alert-routing service.

If the error budget is exhausted, the operator freezes ordinary feature releases and permits only reliability/security repairs after review. Resume normal changes after the budget and incident actions are reviewed. An SLA is a separate commercial commitment requiring measurement, staffing, dependencies and contractual remedies; it is not supplied by this repository.

Sources: [Google SRE error-budget policy](https://sre.google/workbook/error-budget-policy/), [SLO implementation](https://sre.google/workbook/implementing-slos/). Operational ownership and restore acceptance: [OPERATIONS.md](OPERATIONS.md).
