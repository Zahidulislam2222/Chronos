# Defect log

| Date | What escaped | Gate that should have caught it | Gate added |
|---|---|---|---|
| 2026-09-14 | The locally delivered redesign was rejected for generic composition, weak product imagery and insufficient motion despite passing functional checks. | Reference-based visual review of the defining scene before expanding the design. | Replacement brief, asset qualification and camera prototype required before full-page implementation. |
| 2026-09-14 | Initial cinema checks reloaded after changing motion preferences, missing a live preference bug in the installed animation hook. | Live preference-change behavioral gate. | Reactive browser media subscription; toggle without reload regression. |
| 2026-09-14 | A failed product photograph left the gallery fallback active when a valid image was selected. | Failed-media recovery through the full gallery flow. | Source-specific failure state; failed-to-valid thumbnail regression. |
| 2026-09-14 | Cloudflare injected its automatic analytics beacon only after proxying the public hostname, violating the accepted external-request boundary. | Real browser test through the final CDN hostname. | Added origin no-transform for HTML and reran public network/behavior checks. |

| 2026-09-14 | Storage-denied browser crashed while loading the API module. | Import-time preview/storage isolation check. | Safe storage access and denied-storage-before-load regression. |

| 2026-09-14 | CDN beacon attempted on 404 responses after hardened-01. | Public error-response network check. | Status-aware no-store/no-transform with always; repeated public route/network assertions. |

| 2026-09-14 | Scoped review found the blocks CI job calling the frontend-only build:client script. | Workflow-to-package script validation. | Restored blocks build script, added block lint to CI, and validated npm script references by working directory. |

| 2026-09-15 | A completed visual preview was presented as project completion while the public storefront remained disconnected from existing WordPress content and admin workflows. | Acceptance review against the full requested CMS workflow and real deployed frontend/backend verification. | Added explicit connected recovery criteria, product/post/page/admin/login/contact/test-payment checks, deployment parity and evidence-based completion reporting. |
| 2026-09-15 | An interrupted current-user request cleared a valid stored login during rapid full-page navigation. | Repeated authenticated deep-link navigation with interrupted requests. | Preserve the token on transport failure; clear it only on explicit authentication rejection, and rerun the receipt/navigation flow. |
| 2026-09-15 | Contact endpoint404 was interpreted as a saved submission. | Negative-path browser checks for persistence acknowledgements. | Limit nullable404 to editorial lookup and validate saved record ID; browser404/500/malformed200 retain the unsent note. |
