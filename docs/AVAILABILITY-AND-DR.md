# Availability, Monitoring, Incident Response and Disaster Recovery

**Status:** Chronos has a **99% availability objective**. It has no measured
uptime record and no SLA. This document defines how availability is measured,
what the current topology can realistically achieve, and what is required for
99% and then 99.9%.

## Service level objectives

| SLI (what is measured) | Definition | Objective |
|---|---|---|
| Availability | Share of 60-second external probes where `/`, `/shop` and `/healthz` return HTTP 200 with the expected text within 10 s (`config/operations.json`) | **99%** per rolling 30 days (phase 1) → **99.9%** (phase 3) |
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
| Google's Compute Engine SLA for a single instance is ≥ 99.9% in Premium Tier regions ([Compute Engine SLA](https://cloud.google.com/compute/sla)) | That covers the VM, not WordPress, PHP, MySQL, TLS renewal or our releases. Whether SLA credits apply to always-free usage was not verified |
| Ephemeral IP behind the sslip.io hostname | Stopping the VM changes the backend address. It must not be stopped |
| No automated off-server backup today (see below) | A disk loss would mean data loss back to the last manual backup |
| Pre-rendered frontend HTML | The storefront shell and editorial snapshots can still load while the backend is down; live catalogue, login and checkout cannot |

**Honest assessment:** 99% (7 h 12 min per month) is realistic on this
topology **only with** external monitoring, alerting and a practised restore.
99.9% is **not** realistic without redundancy. Phase 3 of the
[roadmap](ROADMAP.md) adds it.

## Monitoring

Available now:

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
   affected feature into preview mode (`VITE_STOREFRONT_MODE=preview` stops
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

### Current state (honest)

- The weekly backup workflow wrote a database dump and an uploads archive on
  the server and uploaded them as GitHub Actions artifacts. Its last
  automated run was on 6 July 2026.
- Because this repository is **public**, workflow artifacts can be downloaded
  by anyone with read access. The artifact upload is therefore **disabled**
  (commented out) and the workflow is off. **No automated off-server backup
  is running right now.** This is the most important operational gap.

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
| **RPO** (max data loss) | Undefined (no running backups) | 24 h | ≤ 5 min (PITR) |
| **RTO** (time to restore service) | Undefined | 4 h | ≤ 15 min (zone failover), ≤ 4 h (region loss) |

## Disaster scenarios

| Scenario | Today | Mitigation / runbook |
|---|---|---|
| Bad frontend release | Previous immutable release kept | Switch back to the previous release directory; verify hashes and `/healthz` |
| Bad plugin release | Local source is the source of truth | Redeploy the previous commit's plugin files; re-hash local vs live |
| Backend VM lost | Full dynamic outage; data at risk | Rebuild from `scripts/gcp-setup.sh`, restore latest DB + uploads, re-issue TLS, update the hostname if the IP changed |
| Backend IP changes | Hostname and frontend config break | Avoid stopping the VM; target: static IP + owned domain |
| Database corruption / bad migration | No PITR | Restore latest dump into a copy, verify, then switch |
| Domain or hosting expiry | **Happened in 2026**: the original domain and cPanel hosting expired | Registrar auto-renew, expiry alerts, and DNS documented in the private recovery record |
| CDN outage | Frontend unreachable through the proxy | Documented DNS-only fallback, with the security trade-offs noted |
| Stripe outage | Checkout unavailable | Checkout reports unavailable; nothing is charged; no order is marked paid without verification |
| Credential leak | — | Rotate the secret, review access logs, assess notification duties, record the incident |
| Region outage | Full outage | Phase 3: warm DR region with replica and backups |
