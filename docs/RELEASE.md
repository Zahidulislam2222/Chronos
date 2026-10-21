# Release record and engineering roadmap

Updated: 21 October 2026. Release checks apply to the stated revision and environment. Frontend, remote AI and backend SDK 20 are deployed with executed recovery/parity; consult [verification](VERIFICATION.md) for measured scopes, source gates and remaining operational requirements.

## Before and after

| Area | Earlier state | Current implemented behavior | Next acceptance gate |
|---|---|---|---|
| Storefront | Client-rendered delivery and earlier navigation | Pre-rendered routes, maintained catalogue policy, responsive navigation, account/cart/contact and hosted test checkout | Keep release artifacts tied to the published source and verify every deployed file |
| Guidance | Help pages and contact navigation | Approved remote AI topic selection, maintained answers/sources, cancel/reset and failure links; local engine paused | Nine current held-out tasks passed; re-evaluate every model/knowledge change and measure representative inference workload |
| Privacy tools | Native database string identifiers could be omitted; read failure could resemble an empty result | Validated native identifiers, actual erasure count and explicit safe database-read errors | Broader engine, privilege, migration and concurrent-request coverage |
| Runtime recovery | Previous versioned storefront | Tested failed-promotion rollback, retained prior artifacts and persistent inference accounting | Patched images, real-provider checks and restart/rollback passed; maintain recurring scans and operating evidence |
| Dependencies | Earlier tooling and deployed payment SDK cohort | Maintained locks and parser-security regression coverage | SDK 20.3.1 native compatibility, rollback and hosted test reconciliation passed; keep future upgrades gated |
| Documentation | Earlier implementation and dependency snapshots | Current behavior, evidence, operations and staged growth requirements | Recheck links, revision references and operator decisions on every release |

## Delivered product scope

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
