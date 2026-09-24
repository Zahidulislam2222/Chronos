# Deployment and CI/CD

## Current production (active)

| Part | Host | Address |
|---|---|---|
| Frontend | Existing VPS: Docker Nginx container (read-only, non-root) behind Caddy HTTPS and Cloudflare | https://chronos.zahidul-islam.com |
| Backend | Google Cloud e2-micro VM (always-free tier): Nginx, PHP-FPM 8.1, WordPress, WooCommerce, MySQL/MariaDB, Let's Encrypt | https://chronosbackend.35-222-94-93.sslip.io |

### Release rule: local first, then live

Every change is made and verified in this repository first, then deployed.
The live server is never edited directly.

1. **Drift check** — hash the live files that will change and compare them
   with local. If live is ahead of local, stop and reconcile first.
2. **Build and verify locally** — run every gate in
   [VERIFICATION.md](VERIFICATION.md#reproduce-repository-gates).
3. **Stage a new versioned release** — frontend releases go into a new
   immutable directory; the previous release is kept for rollback.
4. **Validate the candidate** — Nginx/Compose config test, health check,
   routes, headers, 404s and media range requests.
5. **Promote** — switch to the new release.
6. **Prove parity** — re-hash every deployed file (SHA-256) and confirm local
   equals live.

### Frontend release

Configuration lives in [`deploy/shared-vps/`](../deploy/shared-vps/README.md):
`compose.yaml` (container hardening and resource limits), `nginx.conf` /
`nginx.connected.template` (routing, route validation, security headers,
request budget), `site.caddy.template` (HTTPS) and `runtime.env.example`.

```bash
# Build with the connected production settings in an ignored env file
npm ci
npx playwright install chromium
npm run build            # vite build + pre-render
npm run verify:release   # checks rendered pages and canonical URLs
```

Access details, DNS identifiers and exact release paths are private and are
not part of this repository.

### Backend release

Only the custom plugins are deployed from this repository:
`chronos-bridge`, `chronos-blocks` and `wp-graphql-cors-master`. WordPress
core, WooCommerce and the WPGraphQL plugins are installed and updated on the
server with WP-CLI. Composer runtime dependencies (`stripe/stripe-php`) are
installed on the server; dev tools are not needed there.

## GitHub Actions

| Workflow | Trigger | What it does | State |
|---|---|---|---|
| **CI Pipeline** (`ci.yml`) | push to `main`, every pull request, manual | PHP (PHPCS + PHPUnit on PHP 8.1), Gutenberg blocks (lint, build, Jest; audited in Security), frontend (audit, typecheck, lint, pre-render build, release check) | **Active** |
| **Security** (`security.yml`) | push to `main`, pull requests, weekly Monday 06:00 UTC, manual | `npm audit` (frontend + blocks), `composer audit` | **Active** |
| **CodeQL** (`codeql.yml`) | push to `main`, pull requests, weekly, manual | Static analysis of TypeScript/JavaScript and workflow files | **Active** |
| CI → `deploy-gcp` + `verify` | manual on `main`, only if repo variable `CHRONOS_ACTIONS_ENABLED=true` | rsync custom plugins to the backend VM over SSH, then health-check | Opt-in, **off by default** |
| CI → `deploy-frontend` | — | Cloudflare Pages deploy | **Superseded, off** (`if: false`) |
| CI → `deploy-cpanel-legacy` | — | cPanel UAPI deploy | **Retired, off** (`if: false`) |
| Deploy to Production (`deploy.yml`) | — | cPanel Fileman deploy with dry-run gate | **Retired, off** (`if: false`) |
| Weekly Backup (`backup.yml`) | manual, only if `CHRONOS_ACTIONS_ENABLED=true` | Server-side DB + uploads backup | **Off**; artifact upload disabled for the public repo |
| Dependabot | weekly | Dependency monitoring; version-update PRs paused (`open-pull-requests-limit: 0`) | Configured |

The quality workflows need **no secrets**, so pull requests from forks run
them safely. Deployment jobs use repository secrets and never run on pull
requests.

### Why automatic deployment is off

Releases are promoted manually with a local-vs-live hash comparison (above).
The `deploy-gcp` job syncs plugins with `rsync --delete`. Running it without
the drift check could overwrite a newer live file, so it stays opt-in.

### Why the backup artifact is off

This repository is public. GitHub lets anyone with read access download
workflow artifacts, which for a public repository means any signed-in GitHub
user. A database dump contains customer records and settings, so it must not
be uploaded as an artifact here. The steps are commented out, not deleted. The
replacement design (encrypted backups to private object storage) is in
[AVAILABILITY-AND-DR.md](AVAILABILITY-AND-DR.md#backups).

## Hosting history

| Period | Frontend | Backend | Status |
|---|---|---|---|
| Until May 2026 | AridHost cPanel (`chronos.healthcodeanalysis.com`) | AridHost cPanel (`chronosbackend.healthcodeanalysis.com`) | **Worked in production.** Deployed by `scripts/ci-deploy.py` (cPanel UAPI Git pull + Fileman upload), `.cpanel.yml` and `scripts/deploy.sh`. Retired when the hosting expired and the domain was not renewed. Code kept as reference. |
| May – Sep 2026 | Cloudflare Pages (`chronos-vwg.pages.dev`) | GCP e2-micro VM (sslip.io hostname) | Worked; migrated with `scripts/gcp-setup.sh` and `scripts/prepare-db.py`. The Pages site still serves an older build and is **not** the current frontend. |
| Sep 2026 – now | VPS container release (`chronos.zahidul-islam.com`) | GCP e2-micro VM | **Active** |

## Required secrets (only for the opt-in deployment jobs)

| Secret | Used by |
|---|---|
| `GCP_SSH_PRIVATE_KEY`, `GCP_HOST` | `deploy-gcp`, `backup` |
| `CF_WRANGLER_CONFIG`, `CLOUDFLARE_ACCOUNT_ID`, `GH_PAT` | superseded `deploy-frontend` |
| `CPANEL_URL`, `CPANEL_USERNAME`, `CPANEL_API_TOKEN` | retired cPanel jobs |

No secret is needed to build, test or contribute.
