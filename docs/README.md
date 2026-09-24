# Chronos documentation

Public documentation for the Chronos headless WordPress + WooCommerce
storefront. Each document separates what is **implemented and measured**
from what is a **target**; targets are always labelled.

## Start here

| Document | Read it for |
|---|---|
| [Architecture](ARCHITECTURE.md) | Components, request and checkout flows, design decisions, current limits |
| [API reference](API.md) | `chronos/v1` REST endpoints, GraphQL usage, access rules, error codes |
| [Deployment and CI/CD](DEPLOYMENT.md) | Current VPS hosting, local-first release process, GitHub workflows, hosting history (including the retired cPanel pipeline) |

## Scale and reliability

| Document | Read it for |
|---|---|
| [Scalability](SCALABILITY.md) | Workload model, today vs target, and the target architecture for 1M+ concurrent users with capacity math |
| [Availability and DR](AVAILABILITY-AND-DR.md) | SLOs (99% now, 99.9% target), error budgets, monitoring, incident response, backups, RPO/RTO |
| [Roadmap](ROADMAP.md) | Phased plan with exit criteria and the real-commerce launch track |

## Security and compliance

| Document | Read it for |
|---|---|
| [Threat model](THREAT-MODEL.md) | Assets, trust boundaries, STRIDE threats, controls, residual risk |
| [Security operations](SECURITY-OPERATIONS.md) | Implemented controls, release gates, operating limits |
| [Legal and compliance](COMPLIANCE.md) | GDPR, ePrivacy, CCPA, PCI DSS, consumer law, accessibility, AI Act, CRA, licensing (not legal advice) |
| [Search, security and legal review](SEARCH-SECURITY-LEGAL-REVIEW.md) | Detailed cited review of search, security and legal readiness |
| [Security policy](../SECURITY.md) | How to report a vulnerability |

## Evidence

| Document | Read it for |
|---|---|
| [Verification](VERIFICATION.md) | Dated test, release and browser-flow evidence |
| [Changelog](../CHANGELOG.md) | Notable changes by release |

## Project

- [Contributing](../CONTRIBUTING.md) · [Code of Conduct](../CODE_OF_CONDUCT.md) · [Third-party notices](../THIRD-PARTY-NOTICES.md)
- Backend setup: [wordpress/README.md](../wordpress/README.md)
- Plugins: [chronos-bridge](../wordpress/wp-content/plugins/chronos-bridge/README.md) · [chronos-blocks](../wordpress/wp-content/plugins/chronos-blocks/README.md)
- Frontend hosting templates: [deploy/shared-vps](../deploy/shared-vps/README.md)
