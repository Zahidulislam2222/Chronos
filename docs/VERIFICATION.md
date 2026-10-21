# Current deployed release — 21 October 2026, final runtime cohort

The frontend, remote AI guide and Stripe SDK 20 backend are deployed. Test payments remain enabled; products are illustrative and nothing is shipped. This release passed the scoped checks below. The enclosing Git revision and its Actions checks identify the published source; operating and growth objectives remain separately tracked.

| Gate | Executed result and scope |
|---|---|
| Public commerce | 222 checks passed after frontend/backend promotion: catalogue, journal, accounts, cart, saved contact, hosted Stripe TEST payment, backend reconciliation and logout; zero browser runtime errors. |
| Actual remote AI | 9/9 held-out synthetic tasks passed through loopback HTTP and the real approved provider, including unknown-topic handling; exact maintained answers/sources/version, no-store and per-request deadline checked. Three denial/refusal checks passed. No automatic retries. This is a small task evaluation, not a latency percentile or capacity measurement. |
| Public browser/AI | 33 checks passed across Chromium, Firefox and WebKit, including one actual public HTTPS OpenRouter answer, source link, reset, keyboard/focus, narrow layout, scoped axe, contact and no-JavaScript catalogue. |
| Runtime recovery/parity |Guide drain/restart preserved identical journal bytes; actual frontend promotion→previous source on patched runtime→resume passed. Both releases retain the union of immutable cached assets. All 140 frontend / 140 fallback / 611 guide files match prepared artifacts;17 shared proxy files unchanged. |
| Backend upgrade/recovery |Native PHP 8.1/MariaDB 10.6 and WordPress checks passed; SDK 16.6→20.3.1→16.6 controlled rollback and 20.3.1 promotion executed. Twelve synthetic privacy checks passed. Immutable 520-file production cohort verified; shared PHP master unchanged. |
| Source/build | 40 Node tests, seven Chromium render-readiness checks,47 PHP tests/94 assertions, PHP style,19 block tests, parser regressions,66 Python tests plus two subtests, Ruff/mypy and both TypeScript projects passed. Frontend lint: zero errors/10 warnings. Connected build:22 pages/16 indexable URLs; all 72 normalized rebuild files equal packaged bytes. Three-engine simulated-provider UI:39 checks. |
| Dependencies and images |Frontend/block npm and locked Composer runtime audits reported zero advisories. Fresh complete Python lock audits reported zero known vulnerabilities across 29 Meta runtime, 12 inventory runtime and 69 development packages after the certifi 2026.10.19 patch; no packages skipped. Full patched Node/web image scans reported zero vulnerabilities/secrets. One upstream web DS-0013 build-style advisory is retained and reviewed as nonblocking; no history flattening or scanner suppression. Node 22.23.3/OpenSSL 3.5.8/Undici 6.28.1 measured separately. |
| Review/security |Independent scoped source, dependency, transaction and artifact reviews passed after fixes. Source secret/SAST checks reported no findings in their recorded scope. Normal hooks and GitHub CI remain required for each published revision. |

Local inference is paused by owner decision after engine vulnerability findings; model data remains retained and ordinary Compose startup does not start that profile. The historical local-model evaluation passed 3 of 8 tasks (5 failed), below its acceptance threshold; that evaluation remains failed. The current remote task results apply to the approved maintained topic classifier, not arbitrary generative answers or future model versions.

The persistent total AI allowance remains USD 0.10. Settled usage and uncertain reservations survive releases; exhaustion fails closed and keeps core navigation/support available. Request flags enforce the selected endpoint, price ceiling and data-collection/ZDR preferences; contracts, processing regions and organizational privacy duties still require operator review. Immediate proxy-peer quotas can group visitors.

First-party backend source/artifact line endings are an explicit packaging transform, checked by `verification/backend-artifact.mjs` and its34-file map. Deployment-specific selector and Composer-generated vendor files have separate manifests. Exact artifact/live parity does not imply a whole-build reproducibility or publisher-signature claim. Stripped Node image scanner language coverage is limited; embedded version checks and mounted dependency tests are separate.

**Future/operational status:** representative 1M+ simultaneous-session capacity, continuously measured 99%/99.9% availability, encrypted off-host restore/RPO/RTO, owned alerts, manual assistive-technology review, runtime/migration DB privilege separation, expanded concurrency/migration coverage, controller/retention/vendor agreements and commercial launch approval are Deferred or Unverified. Owner: Zahidul Islam with the responsible operator/business advisers; exit timing is before commercial launch or the corresponding growth stage, except governance for personal data already accepted, which requires an owner decision now as recorded in COMPLIANCE. Consequences and gates are in [roadmap](ROADMAP.md), [operations](OPERATIONS.md), [compliance](COMPLIANCE.md) and [scalability](SCALABILITY.md).

The sections below preserve earlier dated cohorts. Their former pending state does not override this final cohort.

---

# Historical earlier local-first cohort — 21 October 2026

**Status: the server-hosted local-first AI guide and two-file backend privacy fix are deployed and verified within the scopes below.** The guide can use its approved, bounded OpenRouter fallback. Source review, actual provider execution, public acceptance and recovery have separate evidence. This is a storefront with illustrative products and Stripe test payments; broader production readiness remains incomplete.

| Check | Result and scope |
|---|---|
| Actual private hosted guide | 52 checks passed: cold remote fallback, warm local answer, model outage and remote fallback, recovered local answer, cancellation, denied request boundaries, quotas and runtime hashes. |
| Actual public guide | Ten HTTPS routes and two exact approved local answers passed. Public browser checks passed in Chromium, Firefox and WebKit: 33 checks for keyboard/focus, reset, mobile layout, disclosures, scoped axe, contact and no-JavaScript catalogue. |
| Current commerce | 222 deployed checks passed, including catalogue, accounts, cart persistence, saved contact submission, hosted Stripe test payment and logout. No live payment. |
| Backend privacy | Twelve native WordPress/database checks passed using one synthetic identity: export, actual erasure, empty result and explicit database-read failure. A controlled failure restored the original files; promotion repeated the checks. Error-data status503 is not an observed admin-AJAX HTTP503. |
| Release and recovery | A failed public assertion triggered rollback to the previous storefront/proxy and stopped the guide. Resuming the same runtime preserved identical journal bytes; subsequent activation passed. Deployed frontend122/runtime606/backend2 files match local artifacts; the checked shared proxy files are unchanged. |
| Current source gates | 37 affected Node tests; both TypeScript projects; lint with zero errors/12 warnings; 42 PHP tests/77 assertions; connected22-page/16-indexable build; scoped source security scans and independent review passed. |
| Earlier broader local scope | 39 simulated-provider assistant UI checks, 228 offline storefront checks across three engines, 65 Python integration tests, 19 Gutenberg tests, parser regressions, dependency audits and style gates passed in their recorded cohorts. These are not actual-provider capacity results. |

The earlier held-out local-model result remains **Failed: 3/8**. The owner accepts this model-quality limitation; confident incorrect topic selection can still return an irrelevant maintained answer. Cold local inference can exceed its deadline and use remote fallback. A preload or health response does not guarantee inference readiness. The deployed request path has bounded deadlines and no automatic provider retries.

Spending accounting survives restarts/releases; uncertain outcomes retain reservations. Behind the current proxy chain, client quotas group requests by the immediate proxy peer, not a verified human visitor. Core navigation and guidance/contact links remain usable during AI failure or budget exhaustion.

Container-image vulnerability/provenance verification, broader native-engine migration/concurrency/least-privilege coverage, owner security/data/legal controls, owned alerts, encrypted off-host production restore, manual screen-reader/device testing, continuous operation and representative inference load remain **Unverified** where not separately established. The local Stripe SDK major upgrade remains separate from the measured deployed SDK. Automated accessibility and browser-engine tests do not establish universal WCAG conformance or actual Safari/Edge device coverage.

The dated sections below are historical records. Their former execution/authorization state does not override this release. See [operations](OPERATIONS.md), [testing](TESTING.md) and the [guide procedure](../deploy/assistant/README.md).

---

# Current remediation verification — 20 October 2026

**Status: prepared source and artifacts reviewed; hosted chatbot release incomplete.** The public local-first/OpenRouter guide is implemented locally and its runtime files are staged, but its server model and guide service have not been started. No new public storefront/proxy/backend activation or executed release rollback is claimed. The older release records below retain their dates and do not establish current assistant acceptance.

| Area | Recorded result and scope |
|---|---|
| Actual paid fallback | One synthetic local-failure → OpenRouter request passed: HTTP 200, expected topic, 383 tokens, reported cost USD 0.00003573. Billing metadata applies to that request only; it does not establish account-wide BYOK configuration or a universal invoice cap. |
| Actual local model quality | Held-out Qwen: 3/8 passed, below the acceptance threshold, including two cold timeouts. A packaged cold request returned 503 after 12,017 ms. Documented model-quality limitations remain failed evaluations. |
| Automated assistant/render checks | 33 affected Node checks and seven Chromium rendering checks passed. Eleven UI checks passed with simulated providers; those responses are not paid-provider execution. |
| Builds and metadata | Connected: 22 rendered pages / 16 indexable URLs; preview: 20 / 0. Build, semantic prerender and release checks passed. Account alias metadata and atomic readiness/capture guards are corrected. |
| Types and lint | App/build types passed; lint reported zero errors and 12 warnings. |
| PHP and supported engine | 42 PHP tests / 77 assertions and scoped PHPCS passed. Twenty-six isolated WordPress/MySQL 8.4 checks passed; the same-host synthetic restore took 21.906 seconds including engine startup. This does not prove production/off-host recovery, full transaction concurrency or public HTTP behavior. |
| Security snapshot | 413 public files: Gitleaks found zero secrets; Semgrep reported zero findings/errors across 357 targets with default skips. Bandit retains 135 LOW findings, zero medium/high findings and zero parse errors; all-severity exit 1 is not a clean gate. No suppression. These code scans precede this documentation correction. |
| Artifact/source review | 606 runtime hashes and 72 connected artifact hashes verified in the reviewed scope. The prepared frontend package contains 120 files and retains old immutable chunks. Fresh review found no remaining material source defect in the prepared transaction. |

A real hosted model request, public chatbot/fallback flow, deployed failure/recovery exercise, release rollback and final public-byte parity remain **Unverified**. Runtime staging, mock tests, health checks and script review do not substitute for those executions. Automatic approval review rejected persistent startup/model download before execution; it is distinct from recorded owner authorization. No additional paid call or activation was made for this documentation update.

The guide's maintained paid flag remains disabled. See [assistant deployment](../deploy/assistant/README.md), [testing](TESTING.md) and [operations](OPERATIONS.md). Signing provenance, account/billing coverage, provider data agreements, credential controls, production recovery/alerts and manual/cross-browser accessibility retain their separate readiness limits. No overall ten-phase completion or production-readiness claim is made.

---

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
| GitHub checks | [Draft PR #41](https://github.com/Zahidulislam2222/Chronos/pull/41): 12 successful checks, one npm-audit failure and four deployment jobs skipped; frontend/PHP/block/integration builds/tests, CodeQL, gitleaks, Semgrep, Bandit and Composer audit passed |

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

Use the lockfiles and Node 22.13+ (22.x) or 24+; PHP 8.2+ is required for backend checks.

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
