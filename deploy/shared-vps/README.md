# Static storefront deployment

The public design demo uses the validated local Vite build with `VITE_STOREFRONT_MODE=preview`. It creates no server-side customer data or payment transactions.

Build locally with the public URL in the ignored production environment. Copy `dist/`, `compose.yaml`, `nginx.conf`, a privately supplied runtime `.env`, and the rendered Caddy site into a new immutable release. Pin the verified image digest and reserve an unused loopback port before allocation. Validate Compose and Nginx with the actual UID, filesystem and mounts before activation.

The Nginx container runs as UID101 with a read-only root and static content. Only temporary runtime files use tmpfs. Versioned JavaScript/CSS assets are immutable; non-versioned media revalidates periodically; HTML revalidates and forbids CDN payload transformation. Unknown static assets return404 rather than an SPA document. Maintained routes serve pre-rendered index documents; unknown routes return the rendered404page with HTTP404. Explicit index-file and trailing-slash aliases redirect to canonical URLs.

Caddy handles public HTTPS and reverse proxies to the private loopback binding. Install only the project's site; never replace shared configuration. Check origin TLS, Cloudflare response, deep links, video ranges, browser flows, and all file hashes after deployment. Preserve the previous release for rollback.

The private project-local deployment checkpoint is the operational recovery source. Access details, DNS identifiers, actual release locations and rollback commands do not belong in this public guide. No automatic deployment workflow is enabled by these files.

The origin permits GET/HEAD only, applies a script-restricting CSP plus HSTS and browser capability restrictions, rejects sensitive paths, and limits request sizes/timeouts. The100request/second aggregate origin budget with250burst protects this shared deployment; it is not a concurrency claim. Keep it aligned with measured infrastructure capacity. Docker diagnostic logs rotate at10MB across3files; routine Chronos access logs are disabled.

Validate the actual candidate container before promotion, including error/redirect headers and video range requests. A network-none temporary container with no published port is an isolation option when local Docker is unavailable. Record image/config hashes, then promote exactly that release. Changes to shared Caddy must preserve other sites.

For frontend build CI, install the Playwright Chromium browser and use the typed preview environment. The manual frontend build job accepts CHRONOS_SITE_URL; without it the validation uses a reserved example origin, which must never be promoted as the real public canonical URL. Retained legacy deployments use build:client and are not this static release pipeline.
