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
