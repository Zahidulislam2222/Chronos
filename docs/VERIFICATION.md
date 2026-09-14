# Verified demo release

Verified on 14 September 2026 at [the public Chronos demo](https://chronos.zahidul-islam.com/). This report describes the static portfolio release and separately identifies retained WordPress tooling. It is not a real-commerce launch certification.

## Acceptance and gates

The nine scoped acceptance areas are covered: deployment drift/recovery, truthful search content, static security controls, dependency maintenance, demo legal disclosures, behavioral verification, public deployment parity, project documentation, and scalability architecture/validation tooling. Capacity and availability are design targets requiring future evidence.

| Gate | Observed result |
|---|---|
| Public storefront | 169 checks across 72 route/viewport visits; zero runtime errors or external requests |
| Public search and security | 138 checks passed, including initial HTML, structured data, storage, CSP and HTTP responses |
| Accessibility automation | 12 axe page/viewport scans, zero violations; manual accessibility review remains necessary |
| Cinema, media recovery, canonical aliases | 84, 8 and 5 checks passed respectively |
| Static artifact | 19 HTML documents; 14 indexable canonical URLs; release verifier passed |
| Deployment identity | All 71 release files matched local SHA256 hashes; release archive restore also matched |
| Application types and production build | Passed |
| Frontend lint | Zero errors; 12 existing warnings |
| Dependency audits | Zero npm advisories in both frontend and WordPress block package trees on the verification date |
| Retained WordPress tooling | 19 unit tests passed; block lint and asset build passed; patched SockJS transport passed an actual local WebSocket echo |
| Configuration | 105-file frontend regression passed; all five public environment variables checked |
| CI configuration | Nine npm script references resolved against their workflow working directories; remote workflows were not run |
| Source scanning | No secret findings in scanned release/application configuration and block source; historical/private-helper exceptions below |
| Fresh-context review | Promotion blockers resolved; tooling review caught a CI script mismatch, corrected before handoff |

The real public flow exercised catalogue browsing, filtering, product galleries, selection controls, keyboard behavior, reduced motion, media failure/recovery, legal pages, denied storage, missing routes and redirects. Local tests alone were not counted as public evidence.

## Reproduce the repository gates

Use Node 22.13 or newer and install dependencies from the lockfiles.

```bash
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run lint
npx playwright install chromium
npm run build
npm run verify:release
npm run capacity:model

cd wordpress/wp-content/plugins/chronos-blocks
npm ci
npm audit --audit-level=moderate
npm run lint:js
npm run build
npm test -- --runInBand --watch=false
```

The local preview defaults to non-indexable until the documented public-site configuration explicitly enables indexing. Personal browser/regression scripts and raw operational evidence remain in the private workspace; the committed release verifier and CI steps provide reproducible repository checks.

## Limits that affect interpretation

- 10,000–1,000,000 simultaneous readers and 99% availability are targets. No distributed production load test, failover demonstration or 30-day availability measurement establishes those claims yet. See [Scalability](SCALABILITY.md).
- The public demo has no working payment, order, account or contact-submission backend. PHP tests and a real WordPress editor integration test were not run in this environment. Retained backend code requires its own security/configuration audit before activation.
- Full-history secret scanning flagged two vendored JWT documentation key examples. Private SSH deployment helpers retain reviewed Bandit command-execution advisories. These are not represented as clean history or universal scanner passes.
- Output-path traversal and directory-symlink tests passed. Creating a destination-file symlink was unavailable on the Windows test host, so that case is not claimed passed.
- The origin has application limits, but this pass is not a full host penetration test or a verified CDN-origin isolation design. See [Security operations](SECURITY-OPERATIONS.md).
- Search indexing, AI citations, legal compliance for a future business, and manual WCAG conformance are not guaranteed. See the [cited US/EU applicability review](SEARCH-SECURITY-LEGAL-REVIEW.md).

No paid service, monitoring subscription or paid API call was added by this hardening pass.
