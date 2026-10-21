# Changelog

## 2026-10-21 — final runtime and public handover

- Deploy patched frontend and remote AI runtime; pause vulnerable local inference with model data retained. Preserve the existing total inference cap and uncertain reservations.
- Upgrade deployed Stripe PHP SDK 20.3.1 through an immutable cohort, native rollback/compatibility checks and hosted test-payment reconciliation without shared PHP restarts.
- Verify frontend rollback/resume, guide journal-preserving recovery, exact artifact parity, real remote tasks and public commerce/browser journeys.
- Publish all first-party components, nine READMEs, source/dependency security gates and comprehensive architecture/legal/security/operations/capacity/availability roadmap.1M+ simultaneous sessions and99%/99.9% remain staged objectives.


## 12 October 2026 — Complete source publication and operating documentation

- Publish the storefront navigation/content update, advertising MCP component and private n8n inventory workflow source.
- Update all maintained READMEs and add configuration, testing and operations guides. Expand the 1M+ concurrent-session architecture, 99% availability objective, roadmap, privacy/legal and security runbooks.
- Fix inventory container paths/listening, stale batch processing and unbounded validation errors; add regression coverage. Installed-service rollout remains separate.


Notable changes to Chronos. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are UTC.

## 2026-10-12 — Storefront completion and deployment

- Deployed direction-aware sticky navigation, grouped footer and responsive CMS pages.
- Retained five products with illustrative imagery and completed three journal articles; preserved four unfinished records as drafts.
- Added one runtime/build publication policy, deduplicated ordered product galleries and calculated article reading time.
- Replaced the older CSS dependency chain with Tailwind 4 and patched source-map tooling; fresh frontend npm audit has zero advisories.
- Restored visible article source links and scoped content typography; corrected checkout wording while retaining internal order compatibility.
- Verified 222 live browser checks, 107 navigation checks, a completed Stripe test payment, native persistence/unchanged stock, public HTTP statuses and exact deployment hashes.
- Independent source and release reviews passed after fixes. Checkout remains test-only; no goods are shipped. Browser minimums are Safari 16.4+, Chrome/Edge 111+, Firefox 128+.

## [Unreleased] — open-source release

### Added
- Direction-aware sticky navigation with keyboard/drawer access and reduced-motion support.
- Grouped footer links, primary Contact link, breadcrumbs and responsive CMS information pages.
- Shared public catalogue exclusion policy for runtime reads and generated routes.
- Public documentation set in `docs/`: architecture, API reference,
  deployment and CI/CD, 1M+ user target architecture, availability and
  disaster recovery, roadmap, threat model and legal/compliance readiness.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1),
  `THIRD-PARTY-NOTICES.md`, issue templates.
- GPL license texts for `chronos-bridge`, `chronos-blocks` and the bundled
  `wp-graphql-cors`.
- CodeQL workflow for TypeScript/JavaScript and GitHub Actions files.

### Changed
- CI Pipeline and Security workflows now run automatically on pushes to
  `main` and on every pull request (Security also weekly). They need no
  secrets.
- Retired pipelines are labelled and switched off with `if: false` instead of
  being deleted: the cPanel jobs (worked in production until the hosting
  expired in May 2026) and the Cloudflare Pages frontend deploy (superseded by
  the VPS release).
- The deployment verify job now checks the current frontend URL.
- PHP dev tooling updated in `composer.lock` to clear advisories:
  `squizlabs/php_codesniffer` 3.13.6, `wp-coding-standards/wpcs` 3.4.1,
  `phpcsstandards/phpcsutils` 1.2.3, `phpcsstandards/phpcsextra` 1.5.1,
  `dealerdirect/phpcodesniffer-composer-installer` 1.2.1 (dev-only; runtime
  dependencies unchanged).
- README rewritten for open source; licensing clarified (MIT root,
  GPL-2.0-or-later WordPress plugins). New READMEs for `docs/`,
  `chronos-blocks` and the VPS templates; backend and `chronos-bridge`
  READMEs brought up to date.

### Fixed
- `wordpress/setup.sh` hung forever on a fresh clone: it waited for
  `wp core is-installed` before it had installed WordPress. It now waits for
  the database, installs WP-CLI into the container when missing (the official
  image has none), and accepts `CHRONOS_WP_CONTAINER` / `CHRONOS_SITE_URL`.
- The backend Quick start now lists the missing steps (Composer before
  activation, WPGraphQL add-ons from GitHub releases, editorial seed). The
  full sequence was run from a clean checkout.
- `.gitignore` now covers the add-on folder names created by the release-zip
  installs, so third-party plugins cannot be committed by accident.
- Missing spaces in older docs (for example "actual404", "PHP38 tests").

### Security
- The backup workflow no longer uploads database dumps as GitHub Actions
  artifacts, which a public repository would expose to any signed-in GitHub
  user. The steps are commented out and documented.
- Route validation in `scripts/prerender.mjs` used a regular expression with
  exponential backtracking (CodeQL `js/redos`, high). A hostile or malformed
  CMS slug could stall the build. Replaced with an equivalent linear pattern
  (identical results on 195,310 generated inputs).
- `src/lib/parseWPContent.ts` stripped `<script>` tags and HTML with regular
  expressions (CodeQL `js/bad-tag-filter` and
  `js/incomplete-multi-character-sanitization`, high). `</script >`,
  `onerror` handlers and `javascript:` links got through. No page imports
  the module, so the storefront was not affected. It now uses the same
  DOMPurify helpers as the rendered CMS content.

## 2026-09-15 — Connected WordPress storefront

- Cinematic storefront connected to live WordPress/WooCommerce products,
  posts, pages and menus.
- Accounts, persisted contact inbox and server-priced, idempotent Stripe
  **test** checkout with verified order reconciliation.
- Real 404s for draft/missing routes; live sitemap.
- See [docs/VERIFICATION.md](docs/VERIFICATION.md) for gate results.

## 2026-09-14 — Cinematic frontend and hardening

- Redesigned cinematic frontend, pre-rendered HTML, structured metadata.
- Hardened container release, CSP/HSTS, request budget, versioned releases.

## 2026-05 — Migration off expiring hosting

- Backend moved from cPanel to a Google Cloud always-free VM; frontend moved
  to Cloudflare Pages.

## 2026-04 — Security and CI/CD hardening

- CI pipeline, security audits, Dependabot, branch protection guidance,
  `SECURITY.md`.
