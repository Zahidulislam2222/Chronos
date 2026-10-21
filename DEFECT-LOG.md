# Defect log

| Date | What escaped | Gate that should have caught it | Gate added |
|---|---|---|---|
| 2026-09-14 | The locally delivered redesign was rejected for generic composition, weak product imagery and insufficient motion despite passing functional checks. | Reference-based visual review of the defining scene before expanding the design. | Replacement brief, asset qualification and camera-motion verification required before full-page implementation. |
| 2026-09-14 | Initial cinema checks reloaded after changing motion preferences, missing a live preference bug in the installed animation hook. | Live preference-change behavioral gate. | Reactive browser media subscription; toggle without reload regression. |
| 2026-09-14 | A failed product photograph left the gallery fallback active when a valid image was selected. | Failed-media recovery through the full gallery flow. | Source-specific failure state; failed-to-valid thumbnail regression. |
| 2026-09-14 | Cloudflare injected its automatic analytics beacon only after proxying the public hostname, violating the accepted external-request boundary. | Real browser test through the final CDN hostname. | Added origin no-transform for HTML and reran public network/behavior checks. |
| 2026-09-14 | Storage-denied browser crashed while loading the API module. | Import-time offline/storage isolation check. | Safe storage access and denied-storage-before-load regression. |
| 2026-09-14 | CDN beacon attempted on 404 responses after hardened-01. | Public error-response network check. | Status-aware no-store/no-transform with always; repeated public route/network assertions. |
| 2026-09-14 | Scoped review found the blocks CI job calling the frontend-only build:client script. | Workflow-to-package script validation. | Restored blocks build script, added block lint to CI, and validated npm script references by working directory. |
| 2026-09-15 | A completed visual website was presented as project completion while the public storefront remained disconnected from existing WordPress content and admin workflows. | Acceptance review against the full requested CMS workflow and real deployed frontend/backend verification. | Added explicit connected recovery criteria, product/post/page/admin/login/contact/test-payment checks, deployment parity and evidence-based completion reporting. |
| 2026-09-15 | An interrupted current-user request cleared a valid stored login during rapid full-page navigation. | Repeated authenticated deep-link navigation with interrupted requests. | Preserve the token on transport failure; clear it only on explicit authentication rejection, and rerun the receipt/navigation flow. |
| 2026-09-15 | Contact endpoint 404 was interpreted as a saved submission. | Negative-path browser checks for persistence acknowledgements. | Limit nullable 404 to editorial lookup and validate saved record ID; browser 404/500/malformed 200 retain the unsent note. |
| 2026-09-24 | Scheduled database backups were uploaded as downloadable Actions artifacts on a public repository. | Review of every workflow artifact for public visibility before the repository was public. | Artifact uploads disabled; project rule forbids DB dumps as artifacts; credential rotation tracked privately. |
| 2026-09-24 | `setup.sh` hung on a fresh clone because the base image has no WP-CLI. | Fresh-clone setup test in an isolated environment. | setup.sh installs WP-CLI; Quick start verified from a clean archive in an isolated compose project. |
| 2026-09-24 | A regex-based HTML sanitizer allowed XSS, and a prerender route regex was vulnerable to ReDoS. | Static analysis (CodeQL) on every pull request. | DOMPurify sanitizer; linear route matching; CodeQL on push, pull request and weekly. |
| 2026-10-03 | The pre-commit security layer was configured but never installed, and CI had no secret or Semgrep scan. | Repository security-pipeline compliance check. | Hook installed; gitleaks, bandit and Semgrep added to pre-commit/CI; full-history gitleaks scan clean apart from two allow-listed vendor-README sample keys. |
| 2026-10-03 | `scripts/prepare-db.py` never fixed PHP serialized lengths in mysqldump output (escaped quotes); a test run on a local dump left one value with a wrong length. | A length check of serialized values after the URL rewrite. | Escaped-dump aware length fix (UTF-8 bytes, only strings with the new URL); 0 mismatches on a real dump for longer and shorter hosts. |
| 2026-10-03 | After the Vite 8 upgrade (#35), 16 prerendered pages carried `modulepreload` links to the build-time local server (`http://127.0.0.1:<port>/assets/...`). Found by the fresh review of the next PR before any deploy; the live site still runs the Vite 7 build. | Build-output parity check against the previous version that includes `<link>`/`<script>` tags (the Vite 7 vs 8 diff stripped them). | `prerender.mjs` rewrites local-server-origin URLs to root-relative paths; `verify-release` fails when rendered HTML contains the local server host. |
| 2026-10-03 | On a cold load of any code-split route over a slow connection, the live site (React 18) replaced the prerendered page with the route loader until the page chunk arrived; React 19 made the same flash appear on fast connections (fallback held for at least 300 ms). Found by the fresh review of the React 19 upgrade. | A first-load timeline check with delayed chunks on prerendered routes. | `main.tsx` loads the route chunk before the first render (routes in `src/routes.tsx`); `prerender.mjs` fails if the route loader mounts during the initial render; a failed chunk load keeps the prerendered page. |

| 2026-10-11 | Source wording cleanup missed a legacy CMS product shown in the public catalogue. | End-to-end checks against real CMS content. | Shared runtime/prerender catalogue exclusion policy; browser title/body wording and remaining-product-count assertions added. |

| 2026-10-11 | Connected collection and bag displayed the isolated-mode notice claiming no orders or payments are submitted. | Connected-mode copy assertion in browser flow. | Central connected content now overrides the notice with accurate test-payment and no-shipping limits; rendered-copy regression added. |

| 2026-10-11 | Source links in expanded articles blended into body copy after the CSS toolchain update | Real article accessibility/style gate | Added scoped content link/heading/list styles and computed underline assertion; independent re-review PASS |

| 2026-10-12 | Windows packaging converted Linux release paths to backslashes; preflight stopped activation | Native packaging/remote preflight | POSIX path owner, six-case Windows/Linux regression and earlier staging preflight |

## Inventory publication review — 12 October 2026

| What escaped | Gate that should have caught it | Gate added? |
|---|---|---|
| Documented container database/binding incompatible with read-only filesystem/private service network | Deployment configuration contract | Yes: writable-volume, internal listener and host-loopback assertions |
| Old unprocessed batch restored removed items or stale prices | Out-of-order/restart behavior tests | Yes: newer/empty source supersedes old work, including restart |
| Startup validation disclosed credential prefixes | Actual CLI error-path test | Yes: subprocess stderr uses fixed message without input values |
| Malformed photo port exposed raw input | Hostile URL validation test | Yes: malformed port/bracket errors remain bounded |
| Recommended local WordPress setup exposed known development credentials beyond loopback | Local deployment exposure contract | Yes: both Compose variants asserted in committed CI test |


## Global-rule audit — 20 October 2026

| What escaped | Missed gate | Gate added? |
|---|---|---|
| Historical completion wording did not assess the subsequently required public assistant; no public assistant existed in the verified deployed artifact | Reassess dated readiness against current requirements | Yes: ten-phase/all-rule applicability and explicit local, mocked, paid and public acceptance statuses; public release remains blocked |
| Installed post-tool scanner could fail open when its tools/input/scans failed | Actual scanner failure-contract execution | Yes: reviewed fail-closed repair, 14 contract checks and actual clean TypeScript scan; automatic dispatch remains unverified |

New assistant unit/browser failures found before release remain development findings, not escaped customer incidents.

| 2026-10-20 | Privacy erasure passed native MySQL string IDs to a strict integer delete method; SELECT failures could resemble an empty successful erasure | Real supported-engine privacy flow and explicit database-failure tests | Yes: isolated MySQL8.4 identity-scoped erasure/restore checks and PHP tests for string, invalid/overflow IDs, retained delete failures and SELECT errors; local fix awaits release |

## Completion continuation — 21 October 2026

The following findings escaped earlier local checks; the guide candidate was not publicly activated. Public customer impact is not claimed from local reproductions.

| What escaped | Missed gate | Gate added? |
|---|---|---|
| Failed guide startup retained unused budget ownership after occupied-port or invalid-knowledge errors | Resource cleanup during failed startup, plus asynchronous listener-error handling | Yes: actual child-process regressions and scoped review; runtime errors drain before cleanup |
| Default container/rollback stop timeout was shorter than admitted request handling | Shutdown deadline against the complete request budget | Yes: maintained grace validation, Compose contract and explicit reviewed rollback timeout |
| Homepage captions/excerpts failed contrast despite a passing dialog scan | Whole-page accessibility beyond the dialog | Yes: full homepage axe in the maintained CI browser suite and broader three-engine route checks |
| WebKit pointer activation did not focus the menu button, so Escape could restore the body | Cross-engine pointer/keyboard focus behavior | Yes: retain the actual trigger ref and assert focus recovery in the maintained browser suite |
| New CI browser command passed `dist` as project root, resolving a nested output path | Execute the exact CI command against the artifact layout | Yes: reviewer reproduced the failing command; corrected invocation uses `.` and is documented |

Fresh dependency audits also invalidated older clean results. Compatible patches were applied, exact registry metadata checked and both dependency trees re-audited. No new scan suppression was introduced.

| Hosted fallback returned an upstream HTTP 429 while ordinary logs showed only the outer unavailable response; an earlier PC request had passed | Actual hosted dependency acceptance, explicit routing and correlated upstream diagnostics | Yes: a maintained single endpoint and secret-safe numeric status event, with two failing regressions and 37 passing affected tests. Actual revised routing still requires hosted acceptance; uncertain reservations are retained. |

| Public promotion required a local answer on the first request after a different-topic preload, rejecting a successful remote fallback and triggering rollback | Actual public cold/warm provider behavior; preload is not an inference-readiness guarantee | Yes: record both actual public responses, validate the first approved hybrid answer and require the next warm local answer; retain failed rollout and prove rollback state. |

## Runtime cohort audit — 21 October 2026

| What escaped | Missed gate | Gate added? |
|---|---|---|
| Pinned running images still contained vulnerable system/embedded dependencies; a pinned digest alone had been treated as sufficient runtime evidence | Full audit of the exact image and embedded Node dependency versions before promotion | Yes: complete unchanged image scans, measured Node/OpenSSL/Undici versions, signed pinned package updates, retained findings and independent review; local model paused pending a patched engine |
| Maintained source used a newer payment SDK than the installed runtime dependency cohort | Native deployed dependency and artifact parity check | Yes: immutable runtime cohort, native SDK/API-version probe, controlled rollback, hosted TEST reconciliation and per-file parity |

| 2026-10-21 | The initial publication candidate retained a CA bundle covered by a newly published certifi advisory; CI caught it before merge | Fresh local locked Python dependency audit before pushing | Local full-lock audits now executed; existing CI audit retained unchanged, three certifi locks updated with official hashes |
