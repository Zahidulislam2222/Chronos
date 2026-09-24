# Frontend release on a shared VPS

This folder holds the public, non-secret templates for the frontend that is
live at **https://chronos.zahidul-islam.com**. The static, pre-rendered React
build is served by a hardened Nginx container. Caddy terminates HTTPS on the
VPS, and Cloudflare sits in front. The WordPress backend runs separately (see
[docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)).

| File | Purpose |
|---|---|
| `compose.yaml` | Container definition and hardening |
| `nginx.connected.template` | **Current production config** (connected mode): routing, security headers, request budget, sitemap proxy, and route validation against WordPress. `__WORDPRESS_ORIGIN__` and `__WORDPRESS_HOST__` are filled in at release time |
| `nginx.conf` | Config for a fully static preview-mode build (`VITE_STOREFRONT_MODE=preview`), which needs no backend |
| `site.caddy.template` | Caddy site block for HTTPS and the reverse proxy to the loopback port |
| `runtime.env.example` | Runtime settings: pinned image digest and loopback port |

## Container hardening (`compose.yaml`)

- Nginx runs as UID 101 with a **read-only root filesystem**. Only `/tmp` is
  writable (tmpfs, 16 MB, `noexec`).
- All Linux capabilities dropped, `no-new-privileges`, `pids_limit: 64`,
  128 MB memory, 0.5 CPU.
- The image is pinned by digest and never pulled implicitly
  (`pull_policy: never`).
- Published only on `127.0.0.1`; Caddy is the only public entry point.
- A health check on `/healthz`; Docker logs rotate at 10 MB × 3 files.

## Nginx behaviour

- Only `GET` and `HEAD` are allowed; other methods get `405`.
- Security headers: script-restricting CSP, HSTS, `Permissions-Policy`,
  frame and content-type protections.
- Caching: fingerprinted `/assets/` are immutable for one year. Images, films
  and fonts revalidate hourly. HTML revalidates and forbids CDN
  transformation (`no-transform`).
- Dotfiles, `.php`, `.env`, `.sql`, `.map`, keys and config files return 404.
- Maintained routes serve pre-rendered documents. Any other path is checked
  with an `auth_request` to the WordPress `route-status` endpoint, so drafts
  and missing content return a **real HTTP 404** page instead of an SPA
  shell.
- `/sitemap.xml` is proxied from the WordPress sitemap endpoint over verified
  TLS.
- An aggregate origin budget of **100 requests/second with a burst of 250**
  (`429` beyond that) protects the shared VPS. This is a safety limit, not a
  capacity claim; see [docs/SCALABILITY.md](../../docs/SCALABILITY.md).
- Access logs are off; errors go to stderr.

## Release procedure

1. Build locally with the production settings in an ignored env file:
   `npm ci && npx playwright install chromium && npm run build && npm run verify:release`.
2. Copy `dist/`, `compose.yaml`, the rendered Nginx config, a privately
   supplied runtime `.env` and the rendered Caddy site into a **new, immutable
   release directory**. Keep the previous release for rollback.
3. Validate the candidate before promotion: Compose and Nginx config tests
   with the real UID, filesystem and mounts; health check; routes, 404s,
   redirects, headers and video range requests. A temporary container with
   `--network none` and no published port can be used for isolation.
4. Promote exactly the validated release. Install only this project's Caddy
   site and never overwrite shared Caddy configuration used by other sites.
5. Verify through Cloudflare (TLS, deep links, headers, browser flows), then
   re-hash every deployed file with SHA-256 and confirm local equals live.

No GitHub workflow deploys the frontend automatically. Server access details,
DNS identifiers, release paths and rollback commands are kept in a private
operations record and are not part of this public repository.

## CI note

The CI frontend job builds with the typed preview environment and a reserved
example origin (`https://chronos.example`) unless the repository variable
`CHRONOS_SITE_URL` is set. That example origin
must never be promoted as the public canonical URL.
