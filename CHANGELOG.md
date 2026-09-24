# Changelog

Notable changes to Chronos. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are UTC.

## [Unreleased] — open-source release

### Added
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
- Missing spaces in older docs (for example "actual404", "PHP38tests").

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
