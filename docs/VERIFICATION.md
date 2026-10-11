# Source publication review — 12 October 2026

The publication branch contains the completed storefront source, both first-party WordPress plugins, advertising MCP tools, inventory/n8n source and updated public documentation. All eight maintained READMEs were updated; configuration, testing and operations guides were added. Security/legal, recovery, the 99% availability objective and the staged 1M+ concurrent-session architecture are documented with implementation and measurement requirements.

**Release gate blocked:** the current Gutenberg lockfile audit has 48 dependency findings (27 high, 21 moderate), originating from two unpatched packages: `braces` and `sprintf-js`. Compatible refreshes and verified parser/TOML/KaTeX overrides reduced the original 65 findings and removed all critical/low findings and the other six underlying advisories. No finding is suppressed. Publish for review as a draft PR; do not merge or promote this candidate while the required audit fails.

| Publication gate | Observed result |
|---|---|
| Inventory behavior | 28/28 tests PASS, including actual authenticated loopback HTTP, galleries, sequence, persistence, stale-batch rejection and bounded errors |
| Advertising behavior | 37/37 tests PASS, including actual stdio MCP and separate CLI approval flows; no live provider mutation |
| Python types/lint/security | Both components: mypy, Ruff and Bandit PASS |
| Python dependency audits/build | Both locked runtime audits have zero known findings; both wheels built |
| Frontend | Types, lint (0 errors / 10 warnings), offline build, 19 rendered HTML pages, 14 indexable URLs and release verifier PASS |
| Frontend dependencies | Fresh npm audit: zero known findings |
| PHP | 38 tests / 60 assertions PASS; full PHPCS gate PASS with warnings excluded by the existing CI policy |
| Gutenberg | Final isolated installation: lint/build and 19/19 tests in three suites PASS; all 98 WordPress package records retain the tested release cohort |
| Tooling override compatibility | Selector traversal, TOML configuration, direct KaTeX rendering and Markdown CLI with inline/display mathematics PASS against final installed packages |
| Local WordPress setup | Both Compose variants bind published ports to loopback; committed regression PASS and included in CI |
| Documentation | 180 local Markdown targets checked, zero missing; no rejected presentation wording in maintained prose |
| Independent review | Source/setup/docs PASS after inventory and local-port findings were fixed; dependency gate BLOCKED |

The inventory fixes add container overrides, persistent batch freshness and sanitized errors. They are source changes awaiting a separate drift-checked installed-service rollout. The source SDK upgrade also remains separate from the deployed PHP runtime. This publication does not attach Claude, enable Meta campaigns, publish n8n or provision future infrastructure. Actual Meta/Claude connection, representative capacity and continuous availability remain separate verification gates.

Upstream evidence: [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), [WordPress scripts migration](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/docs/vitest-migration.md). The required resolution is reviewed upstream fixes or a separately reviewed toolchain replacement preserving all block tests, generated assets and editor behavior. Auditing only runtime dependencies would not satisfy the current full-tree gate.

The deployed website evidence below remains a separate, dated release record.

---

# Verified storefront release — 12 October 2026

[Chronos](https://chronos.zahidul-islam.com/) now serves the completed storefront update from the existing host. Scope: the website with Stripe test payments. Seven release acceptance criteria are met: source inventory/drift, finished public content, store/account/contact flows, responsive navigation and correct missing-route behavior, engineering gates/review, guarded deployment/parity, and interruption recovery records.

Before: eight public products, four posts, incomplete source records and an older frontend. After: five photographed illustrative products, three articles of 296–318 words, four unfinished records retained as drafts, responsive information pages and a header that hides scrolling down and returns scrolling up. Existing product identities, prices, media and order history are preserved.

| Gate | Verified result |
|---|---|
| Live browser flow | 222 checks PASS; products, articles, media, search/filter/sort, bag persistence, authentication, account, contact, checkout and logout; zero runtime errors |
| Live navigation | 107 checks PASS across desktop, tablet, mobile and narrow widths, keyboard focus, direction thresholds, drawers and reduced motion |
| Local browser regressions | 189 readiness checks and 7 catalogue-exclusion checks PASS |
| Real test payment | Hosted Stripe test payment verified on return; native WooCommerce order paid/processing; five stock states unchanged |
| Persistence and email policy | Contact record exists in native CMS; nine transactional email filters disabled for the test order |
| CMS content parity | 12 editorial records and final About update match exact maintained field hashes |
| Public HTTP | 33 responses PASS; published pages 200, missing/draft/hidden routes 404, unsupported POST 405, security headers present, exact public root HTML and 16-URL sitemap |
| Types | Application and build-configuration checks PASS |
| Lint | Frontend: 0 errors / 12 existing warnings; scoped edited PHP files: 0 errors / 0 warnings |
| PHP tests | 38 tests / 60 assertions PASS; native syntax checks PASS for the two deployed wording files |
| Dependencies | Fresh frontend npm audit: 0 advisories; new CSS packages verified on npm registry |
| Configuration/security | 121 source files / eight documented public variables / zero configuration findings; installed security scans PASS; authored-scope gitleaks: 0 findings |
| Build/release | Client build, 21 rendered HTML pages, 16 indexable URLs and release verifier PASS |
| Deployment | Candidate validated before activation; 99/99 packaged frontend files and two scoped backend files match local SHA256 hashes; previous release retained |
| Independent review | Fresh source, release-helper and scoped backend reviews PASS after fixes |

Configuration audit: no real secret found in the authored release scope. Maintained editorial data, publication eligibility and reading-time settings have explicit JSON/typed owners; environment access stays in the typed settings boundary. Stable DOM, GraphQL, HTTP and mathematical syntax remains fixed. Credentials, private dossier, memory and personal tests are ignored and untracked. Historical `.env` revisions contain one public frontend endpoint setting; the current file is ignored. No claim that `.env` has never existed in history is made.

The CSS upgrade sets a browser minimum of Safari 16.4+, Chrome/Edge 111+ and Firefox 128+. Old immutable bundles are retained so already-open tabs can continue loading their chunks. PHP wording edits retain the historical internal order marker and do not upgrade the live Stripe runtime. Local SDK/build-dependency upgrades outside this release remain undeployed.

Checkout is test-only and no goods are shipped. Advertising account/Claude attachment remains unverified; n8n inventory is manually verified and its imported workflow remains unpublished, with private review drafts only. No paid resource, paid AI, real payment, ad activation or marketplace publication was performed. No new capacity, continuous-availability, full manual accessibility, legal launch or penetration-test certification is claimed. Recovery records and original snapshots were saved throughout; Google Docs/PDFs were untouched.

The earlier navigation-only notes below are historical and are superseded by this deployed release.

---

# Previous connected release — 15 September 2026

Verified on 15 September 2026 at [Chronos](https://chronos.zahidul-islam.com/). The accepted cinematic frontend now reads WordPress/WooCommerce content and supports real CMS persistence with Stripe test payments. This is not a real-commerce launch certification.

## Acceptance and gates

The eight engineering acceptance areas cover drift inventory, authoritative catalogue/editorial data, CMS pages/navigation/publication, accounts/test payments, contact persistence, safe rendering/routing, verification/review and deployed parity. Documentation/PDF synchronization and the scoped local commit complete the handoff; pushing remains the maintainer's action.

| Gate | Observed result |
|---|---|
| Content inventory | 8 published products, 4 posts, 8 published pages; verification fixtures restored to drafts |
| Connected compiled website | 23 browser checks passed, including catalogue, journal, login, contact and hosted test checkout |
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

## Historical storefront navigation checkpoint (11 October 2026)

The compiled connected storefront passed 107 native-browser checks with zero runtime errors. Checks cover hide-on-down/reveal-on-up behavior at four widths, focus access, drawer navigation, direction jitter, stable layout, reduced motion, six desktop/mobile routes, public copy, product navigation and the preserved seven-product catalogue.

Types, build, 24-page connected prerender, configuration regression and installed security scanning passed. Lint reports zero errors and 12 existing warnings. The local candidate is deliberately non-indexable. Four published information pages were synchronized from the maintained local copy with exact post-content hashes; a final About refinement was also verified. The frontend has not been deployed, and independent fresh-context review remains deferred. No new dependency or paid API call was required.

Seven additional real catalogue checks passed: the excluded source record remains present in WooCommerce while collection links, direct product rendering and generated public routes exclude it. Final release verification passed for all 24 rendered pages. Functional acceptance criteria: 10/10 met; independent review is the remaining release gate.
