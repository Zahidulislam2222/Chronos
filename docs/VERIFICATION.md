# Verified connected WordPress demonstration

Verified on 15 September 2026 at [Chronos](https://chronos.zahidul-islam.com/). The accepted cinematic frontend now reads WordPress/WooCommerce content and supports real CMS persistence with Stripe test payments. This is not a real-commerce launch certification.

## Acceptance and gates

The eight engineering acceptance areas cover drift inventory, authoritative catalogue/editorial data, CMS pages/navigation/publication, accounts/test payments, contact persistence, safe rendering/routing, verification/review and deployed parity. Documentation/PDF synchronization and the scoped local commit complete the handoff; pushing remains the maintainer's action.

| Gate | Observed result |
|---|---|
| Content inventory | 8 published products, 4 posts, 8 published pages; verification fixtures restored to drafts |
| Connected built-preview | 23 browser checks passed, including catalogue, journal, login, contact and hosted test checkout |
| Actual administrator/editor | 4 admin checks; all 3 custom blocks registered; draft save/reload passed |
| Publish/edit without rebuild | 5 browser checks plus actual Nginx routes and sitemap passed |
| Real test payment | Hosted Stripe test payment reconciled to a paid processing Woo order; stock unchanged |
| Payment/persistence regressions | 3 repeated-receipt checks, 2 account/inbox persistence checks, 8 authorization/input HTTP checks |
| Contact error handling | 404, 500 and malformed 200 preserve note and display failure |
| Public browser | 16 content/login/responsive checks plus 3 focused login/logout checks; zero runtime errors |
| Accessibility | 6 public mobile/desktop axe scans, zero detected violations |
| Public HTTPS | 12 checks passed; root HTML exactly matches release; current sitemap and genuine draft 404s |
| Render/release | 25 HTML documents, 20 indexable canonical URLs; release verifier passed |
| Deployment parity | Frontend 78/78 files and backend 86/86 runtime files match local; archive restoration passed |
| PHP | 38 tests, 60 assertions passed; PHPCS 0 errors / 7 warnings |
| Gutenberg | 19 tests, lint and build passed; 17 changed source/build files deployed with parity |
| Frontend gates | Types/client build/render/release passed; lint 0 errors / 12 existing warnings |
| Dependency audits | Zero npm advisories in frontend and Gutenberg package trees |
| Configuration/security | Eight public settings documented; installed final 103-path source scan passed |
| Fresh-context review | PASS after receipt/authentication/contact error-path defects were corrected |

The first final render attempt timed out on a backend page request; the retry rendered all 25 pages successfully. A broad public test incorrectly expected logout to stay on the account page; actual logout redirects home. The test was corrected and the focused public login/logout flow passed. These failures are retained in private evidence rather than counted as successful first runs.

## Open-source release checks (24 September 2026)

Run before the repository documentation and CI changes were merged for the
open-source release. CI results on GitHub are recorded on the pull request.

| Check | Observed result |
|---|---|
| Frontend | `npm audit` 0 advisories; typecheck passed; lint 0 errors; build, pre-render and `verify:release` passed |
| Gutenberg blocks | Lint, build and 19/19 Jest tests passed (Linux container, LF checkout) |
| PHP plugin | After the dev-tool lockfile update: PHPCS 0 errors, PHPUnit 38 tests / 60 assertions passed, `composer audit` clean |
| Backend setup from a clean checkout | README Quick start run on an isolated Docker stack from a `git archive` copy. The first attempt exposed that `setup.sh` could never finish on a fresh install; after the fix, `setup.sh` installed a checksum-verified WP-CLI, WordPress and the plugins (exit 0). It also re-runs cleanly on an installed site and fails fast with a message when the container is stopped. The three WPGraphQL add-ons installed from their release zips; sample data (8 watches) and the editorial seed (4 pages + menu) completed; JWT login returned a token |
| Workflows | All workflow and issue-template YAML parses; `actionlint` reports only the intentional `if: ${{ false }}` on retired jobs and info-level shellcheck notes in the disabled/opt-in deploy scripts |
| Secrets | gitleaks on the staged change set: no leaks |
| Documentation links | All relative links in changed Markdown files resolve |
| Independent review | Fresh-context review of the diff; its accuracy findings (health-check restart wording, live-key wording, CI trigger wording and others) were corrected before commit |

Not verified here: a fresh local stack has no WooCommerce products (no seed
script yet; see the roadmap), so the connected storefront catalogue and
checkout were not exercised against it.

## Reproduce repository gates

Use the lockfiles and Node 22.12+; PHP 8.1+ is required for backend checks.

```bash
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run lint
npx playwright install chromium
npm run build
npm run verify:release

cd wordpress/wp-content/plugins/chronos-blocks
npm ci
npm audit --audit-level=moderate
npm run lint:js
npm run build
npm test -- --runInBand --watch=false

cd ../chronos-bridge
composer install
vendor/bin/phpunit
vendor/bin/phpcs
```

Private manual/browser tests and raw authenticated evidence stay in the ignored workspace. CI regression tests retain their repository convention. Two locally changed PHP test files were intentionally not deployed as runtime code.

## Evidence limits

- Initial HTML snapshots update on rebuild. New CMS routes work through browser rendering and the live sitemap, but do not receive automatically regenerated snapshots.
- Stripe is test-only. No real charge, shipping, order email or paid AI call was performed. Legacy custom Watch/AI/analytics/cron behavior is not comprehensively certified by storefront tests.
- Full-history gitleaks scanned 54 commits and flagged two vendored JWT documentation key examples. Exact upstream-version key hashes matched. No real secret was found in the changed-source scope; raw history is not claimed clean.
- The 10k–1M reader and 99% availability goals have no representative distributed-load or continuous 30-day proof. Active CMS/API/route-status traffic is outside the earlier static workload model.
- Automated accessibility is not complete manual WCAG verification. Host penetration testing, full CDN-origin isolation, commercial legal compliance and universal provider failure recovery remain separate work.
- PHPCS warnings cover direct database/schema operations and WooCommerce capability analysis; frontend warnings include existing Fast Refresh exports and vendored SMTP directives. They were not suppressed.

No paid resource or monitoring service was provisioned in this recovery. See [Scalability](SCALABILITY.md), [Security operations](SECURITY-OPERATIONS.md) and [Legal review](SEARCH-SECURITY-LEGAL-REVIEW.md).
