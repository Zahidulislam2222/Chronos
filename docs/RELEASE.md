# Release record and engineering roadmap

Updated: 25 November 2026. Newest release first; the 21 October record is kept below it. Each check applies to the stated revision and environment. Dated evidence is in [verification](VERIFICATION.md).

## Current release — 25 November 2026

Chronos is a headless WordPress/WooCommerce watch storefront with a pre-rendered React frontend and a bounded AI guide. The November releases hardened the backend, added backups and monitoring, repaired the AI guide route and fixed two storefront faults found while recording a walkthrough. Checkout runs in Stripe test mode: no card is charged and no goods ship.

### Before and after

| Area | Before | After (25 November 2026) | How it was checked |
|---|---|---|---|
| Account privacy | Usernames could be discovered through REST user routes, author archives, the users sitemap, oEmbed and different sign-in errors | All of these answer identically for real and non-existent accounts, including WooCommerce and WordPress lost-password forms and GraphQL `user`/`users` | 37/37 checks against the live backend |
| GraphQL | Debug output, query analyzer and public introspection could be enabled | Forced off; a depth limit always applies; guest avatar hashes hidden | PHPUnit and live exposure checks |
| Health | No dedicated health endpoint | `GET /chronos/v1/health` (database, commerce, GraphQL) and `/health/backup` | Live responses `ok` |
| Backups | No off-host copy | Nightly encrypted off-host copy, 14 days kept, digest-bound acknowledgement, alert after 30 hours | Timed restore into an isolated stack (about 67 s data restore); host rebuild from a clean OS 8 min 40 s |
| Monitoring | Manual probe only | Scheduled GitHub Actions probe (storefront, catalogue, health, backend) with owner alerts; scheduled every 30 minutes, run best-effort by GitHub | A deliberate failure run alerted; normal runs pass. GitHub ran 1 scheduled check in the first 14 hours, so an always-on external monitor remains a Phase 1 item |
| Runtime images | 22 high and 2 critical image findings | Patched nginx 1.30.8 and Node 22.23.5 on Alpine 3.24.4: 0 high or critical | Trivy scans; npm audit 0 (root and blocks) |
| AI guide | Its only provider endpoint stopped qualifying for zero data retention, so every question failed | Mistral Small 3.2 on an allow-list of zero-retention endpoints; refusals release their spend reservation; automatic pause after repeated refusals | 12/13 live tasks, median 946 ms, total cost USD 0.0003 |
| Sign-in expiry | After the GraphQL hardening, an expired sign-in broke the catalogue and journal for that visitor | Public reads never send the sign-in token; expiry checked before signed-in requests; quiet sign-out | 22 regression cases and a browser run against the live backend |
| Payment return page | Said "Payment has not been confirmed" whenever its check was not running | Explicit states: checking, sign in, could not check, missing link, paid, unpaid | Regression tests and browser states |
| Page layout | Footer jumped when the catalogue arrived (layout shift 0.17-0.57) | Loading, error and empty states reserve their space (at most 0.035 on desktop, phone and a tall screen) | Browser measurement, 3 runs per screen |
| Contact data | Messages kept without a limit | Retention setting (off by default) set to 30 days on the live site, with a daily cleanup | Live: 11 older messages removed, 0 remain; job scheduled |
| Source control | `main` accepted direct pushes | `main` protected: pull requests, 10 required checks, administrators included | GitHub branch protection |

### Release process used

Every live change followed the same local-first steps: snapshot and hash the live files, reconcile any drift, build from the reviewed commit, stage a new immutable release next to the previous one, switch over, exercise the real pages, then prove that every deployed file matches the build byte for byte. Backend classes load from an immutable release directory, so rollback is one atomic switch (about 8 seconds in the drill, without restarting the shared PHP service).

### Still open

| Item | Status | Owner and timing |
|---|---|---|
| Stripe test webhook secret on the live backend | Not configured: orders are marked paid when the signed-in buyer returns to the success page | Operator, before relying on unattended payment reconciliation |
| Administrator multi-factor sign-in | Deferred | Operator, before commercial launch |
| Credential rotation after the November work | Deferred | Operator |
| Manual screen-reader review | Not yet done; keyboard flows verified | Maintainer with an assistive-technology user |
| End-to-end recovery time on a new cloud VM | Container rehearsal measured; VM creation, TLS and address change not measured | Operator, at the next recovery drill |
| Continuous 30-day availability report | Probe running; no full reporting window yet | Operator |
| Guide action-guard false positive ("send … the contact form") | Known; one of 13 evaluation tasks | Maintainer, next guide release |

## Previous release record — 21 October 2026

Recorded 21 October 2026. Release checks apply to the stated revision and environment. Frontend, remote AI and backend SDK 20 are deployed with executed recovery/parity; consult [verification](VERIFICATION.md) for measured scopes, source gates and remaining operational requirements.

### Before and after

| Area | Earlier state | Implemented behavior (21 October 2026) | Next acceptance gate |
|---|---|---|---|
| Storefront | Client-rendered delivery and earlier navigation | Pre-rendered routes, maintained catalogue policy, responsive navigation, account/cart/contact and hosted test checkout | Keep release artifacts tied to the published source and verify every deployed file |
| Guidance | Help pages and contact navigation | Approved remote AI topic selection, maintained answers/sources, cancel/reset and failure links; local engine paused | Nine current held-out tasks passed; re-evaluate every model/knowledge change and measure representative inference workload |
| Privacy tools | Native database string identifiers could be omitted; read failure could resemble an empty result | Validated native identifiers, actual erasure count and explicit safe database-read errors | Broader engine, privilege, migration and concurrent-request coverage |
| Runtime recovery | Previous versioned storefront | Tested failed-promotion rollback, retained prior artifacts and persistent inference accounting | Patched images, real-provider checks and restart/rollback passed; maintain recurring scans and operating evidence |
| Dependencies | Earlier tooling and deployed payment SDK cohort | Maintained locks and parser-security regression coverage | SDK 20.3.1 native compatibility, rollback and hosted test reconciliation passed; keep future upgrades gated |
| Documentation | Earlier implementation and dependency snapshots | Current behavior, evidence, operations and staged growth requirements | Recheck links, revision references and operator decisions on every release |

### Delivered product scope

Chronos provides a headless WordPress/WooCommerce storefront, React delivery, GraphQL and REST integration, accounts, persisted contact requests, a cart, server-priced idempotent hosted Stripe test checkout, editorial pages and project-specific AI guidance. Catalogue products and imagery are illustrative. Payment test mode and the absence of physical fulfilment remain explicit user-facing boundaries.

Advertising tools require an authenticated owner account and separate approval for external writes. The inventory integration prepares private listing drafts; source publication does not publish listings or activate advertising. See the component READMEs for their actual deployment and account-setup status.

## Growth and reliability objectives

The roadmap targets **1,000,000+ simultaneous sessions**, initially **99% availability over a rolling 30 days**, then **99.9%** after redundancy and operating evidence. Session concurrency must be translated into requests, read/write mix, transfer, checkout rate and AI requests. An open browser session does not imply a continuously active model request.

The maintained example is a 300-second session with five HTML and 25 asset requests: one million sessions imply approximately 3,333 starts/s and 100,000 edge requests/s. A hypothetical 99% cache hit rate still leaves roughly 1,000 origin requests/s; it is not an observed hit rate. Dynamic account/order/payment traffic requires a separate correctness and capacity budget. The bounded current AI service needs independent admission, inference throughput, queue, cost and quality scaling.

Advance through 500/1,000, 10,000, 100,000 and 1,000,000 concurrent-session stages only after representative load, failure/recovery, security and cost checks. The later topology includes cacheable anonymous delivery, origin shielding, stateless application replicas, controlled database writes/read replicas, queues, protected media storage, dependency quotas and multi-zone recovery where justified. Exact calculations, bottlenecks and exit criteria are in [scalability](SCALABILITY.md) and the [roadmap](ROADMAP.md).

At 99%, a 30-day window permits 432 minutes of unsuccessful service; at 99.9%, 43.2 minutes. Measure browsing, authentication, contact, checkout and AI assistance separately. Define a successful journey, time threshold, sampling coverage and alert owner before reporting results. [Availability and recovery](AVAILABILITY-AND-DR.md) defines monitoring, error-budget decisions, RPO/RTO and restore requirements.

## Public engineering documentation

- [Architecture](ARCHITECTURE.md), [API contracts](API.md) and [configuration ownership](CONFIGURATION.md).
- [Setup and deployment](DEPLOYMENT.md), [testing](TESTING.md), [verification](VERIFICATION.md) and [operations](OPERATIONS.md).
- [Threat model](THREAT-MODEL.md), [security operations](SECURITY-OPERATIONS.md), [security reporting](../SECURITY.md) and [legal/privacy applicability](COMPLIANCE.md).
- [Scalability](SCALABILITY.md), [availability/disaster recovery](AVAILABILITY-AND-DR.md), [roadmap](ROADMAP.md), [change history](../CHANGELOG.md) and [escaped defects](../DEFECT-LOG.md).

The legal register covers actual controller/processor roles, markets and data flows before deciding which privacy, consumer, payment, accessibility, AI and product obligations apply. Owners must resolve identity, agreements, retention, transfers, rights, incident response and commercial-launch requirements for the intended operation.

## Release and handover contract

Build from reviewed source and locked inputs. Snapshot affected live code before editing, reconcile drift, test the smallest release, retain an executable rollback, verify real journeys, and compare all deployed files and images with the reviewed artifacts. Keep keys and customer data outside source, logs and public artifacts. Preserve uncertain inference reservations across restart, rollback and upgrades.

Required checks include tests, types, lint, build, dependency and image audits, secret/source scans, independent review and CI for the published revision. Record each requirement as verified, failed, unverified, deferred or not applicable; name the consequence, owner and next check for remaining items. Continuous uptime, large-scale capacity, manual assistive-technology coverage, encrypted off-host recovery and legal/contractual acceptance require their own evidence.

## Primary references

- [Google SRE: implementing service objectives](https://sre.google/workbook/implementing-slos/) and [error-budget policy](https://sre.google/workbook/error-budget-policy/).
- [OWASP ASVS](https://owasp.org/projects/asvs) and [OWASP GenAI risks](https://genai.owasp.org/llm-top-10/).
- [EDPB data-protection guide](https://www.edpb.europa.eu/sme_en) and [FTC internet-order requirements](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule).
- [WooCommerce high-performance order storage](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/).
