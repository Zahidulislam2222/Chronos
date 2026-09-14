# Security Operations and Release Boundaries

The public frontend is connected to WordPress/WooCommerce. Its container serves built assets, while CMS APIs provide account/contact/order persistence and test payments. Privileged secrets remain server-side. Frontend delivery controls and backend authorization are distinct verified boundaries.

## Controls in the codebase

- Build-time HTML snapshots plus current CMS reads and sitemap; origin route validation returns actual404 for drafts/missing records. New snapshots require rebuild.
- DOMPurify HTML sanitization, allowed media/link origins, server-derived prices, ownership checks, idempotency locks and persisted payment acknowledgement.
- Upstream TLS verification remains enabled with an explicit certificate chain depth and bounded proxy timeouts.
- CSP permits self-hosted scripts and denies inline event handlers, external frames, form submissions, plugins and workers. Inline styles remain allowed for motion/component-library compatibility; the policy is not described as maximally strict.
- HSTS is hostname-scoped, without preload or includeSubDomains. Frame, MIME, referrer, opener/resource and browser-permission policies are verified at the HTTP boundary.
- GET/HEAD only, bounded body/timeouts and an aggregate origin request budget. These controls limit work; they do not distinguish every legitimate visitor from an attacker.
- Non-root, read-only container; dropped capabilities; no privilege escalation; loopback-only port; resource and diagnostic-log limits.
- Request-driven browser selection storage, clear action and denied-storage fallback. Preview import paths must not read commerce session storage eagerly.
- Versioned release directories, exact SHA256comparison, health checks and previous-release recovery. Each mutation has a project-local checkpoint.

## Repeatable local gates

```bash
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run lint
npx playwright install chromium
npm run build
npm run verify:release
npm run preview
```

The retained workspace tests exercise routes, keyboard/gallery/bag behaviour, reduced motion, failed media, no-JavaScript content, structured metadata, aliases, denied storage, accessibility and a harmless CSP injection probe. They accept an explicit configuration-file argument; do not rely on custom WSL environment variables reaching Windows Node. Verify the reported target and evidence path before counting a run as live.

Manual GitHub workflows remain guarded and were not triggered. Root and block dependency audits now fail their jobs on moderate-or-higher findings instead of hiding failure with `|| true`. The current frontend validation installs the rendering browser and validates the static artifact. Legacy cloud deployment jobs are retained historical paths, not the current release mechanism.

## Operating limits and owners

This pass is application/release hardening, not a full host penetration test. The shared server, SSH accounts, operating-system patches, Docker daemon, CDN account, registrar and other projects remain separate security boundaries. MFA, credential rotation, access review and recovery ownership require the actual operator. Root recovery details remain private; credentials are never part of the release.

The private origin port is not publicly reachable, but the public Caddy hostname is still reachable directly at the origin when the correct hostname is supplied. A future hostname-scoped Cloudflare-origin allowlist, authenticated origin connection or tunnel can reduce CDN bypass. No shared-host firewall rule, origin-IP rotation or new tunnel was applied in this pass. Changing such controls requires preserving certificate renewal, health probes and other hosted projects. [Cloudflare origin-protection guidance](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/).

A CDN logo is not a WAF configuration audit. No paid WAF, managed rate-limit add-on, monitoring subscription or load-balancer product was added. The local-only load test must not be repointed at the shared public site. Representative high-capacity validation needs an isolated environment, an approved traffic plan and provider capacity arrangements.

PHP38tests/60assertions passed; PHPCS has0errors/7warnings. Real CMS permissions, contact persistence and hosted test payment were exercised. Real-commerce launch still needs merchant, retention, fulfilment and provider-operating requirements. Public audit counts must identify the package tree and date; a clean frontend audit does not describe every tool in the repository.

## Disclosure and incident handling

Use the developer contact profile linked by the site for initial contact; do not publish secrets or exploit payloads containing personal data in public issues. There is no claimed staffed24/7incident service or bug-bounty programme. Report the affected release, route, observed behaviour, impact and a minimal safe reproduction. Preserve logs and before-state privately, fix locally, run the relevant gate, deploy a verified release and record the incident and proof in the private dossier.

Security scanners remain enabled. The installed Python scanner reports Paramiko execution as an advisory in private deployment helpers; trusted fixed scripts, shell-quoted configuration and pinned SSH host keys are reviewed explicitly. No finding is suppressed to manufacture a clean scan. Zero known frontend dependency advisories is not a claim that the application is attack-proof.

## Dependency maintenance decisions

The root frontend uses the updated Vite7/React Router7 toolchain. Retained Gutenberg tooling uses @wordpress/scripts35 and refreshed WordPress packages. Its transitive overrides select verified patched versions of markdownlint-cli, minimatch3, serialize-javascript and SockJS's uuid dependency. The SockJS source uses the stable uuid.v4 API; a local HTTP-info/WebSocket-echo regression checks that path after the scoped override. No npm audit finding is ignored, and the suggested obsolete WordPress-scripts downgrade is not used.

Unit tests and asset builds passed, and all three custom blocks loaded in the actual WordPress editor. A custom-block draft survived save/reload. Seventeen changed block files were deployed to the backend with exact parity. Version/override decisions should be revisited with the upstream toolchain rather than retained indefinitely.

The Jest configuration extends the WordPress defaults and transforms only the ESM-only `marked` and `uuid` dependency trees for the CommonJS test runner. Current Gutenberg UUID versions remain intact; the separate SockJS override serves its CommonJS transport. Configuration follows [WordPress test tooling](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) and [Jest dependency transformation](https://jestjs.io/docs/code-transformation). The config uses `jest.config.js`, which the installed WordPress runner discovers.

## Connected operating boundaries

Browser JWT storage remains sensitive to script compromise. Sign-out removes the token and local selection; network failure alone does not revoke a valid token. Contact failure preserves the note, and successful submission requires a persisted ID. Contact records are administrator-only. Checkout rejects live session IDs, validates products/quantities server-side and reconciles owner/session/amount/currency before reporting payment success. Demo payments suppress stock reduction and order emails. No paid AI or outbound test message was sent.
