# Chronos — WordPress Backend

Headless WordPress + WooCommerce backend for the Chronos storefront. The React
frontend talks to it through WPGraphQL and the custom `chronos/v1` REST API.
No WordPress theme is rendered to visitors.

```
React frontend ──GraphQL / REST──▶ WordPress + WooCommerce ──▶ MySQL
 (port 8080 locally)                 (port 8888 locally)        (port 3306)
                                          ▲
                           Stripe webhook ┘ (test mode only)
```

Full system design: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
Endpoint reference: [docs/API.md](../docs/API.md).

## Plugins

### Maintained in this repository

| Plugin | Version | License | Purpose |
|---|---|---|---|
| [`chronos-bridge`](wp-content/plugins/chronos-bridge/) | 2.1.0 | GPL-2.0-or-later | Main plugin: REST API, `chronos_watch` post type, Stripe checkout and webhooks, contact inbox, WooCommerce fields, SEO/JSON-LD, analytics, privacy exporter/eraser, caching, cron, i18n, WP 7.0 AI admin helpers |
| [`chronos-blocks`](wp-content/plugins/chronos-blocks/) | 1.0.0 | GPL-2.0-or-later | Gutenberg blocks: Watch Showcase, Collection Grid, Contact Form |
| [`wp-graphql-cors-master`](wp-content/plugins/wp-graphql-cors-master/) | third-party | GPL-3.0 | CORS headers for the headless GraphQL endpoint |

`chronos-bridge` modules (`src/`): `Admin`, `AI`, `Analytics`, `Api`,
`Cache`, `Cron`, `Database`, `GraphQL`, `I18n`, `Payment`, `PostTypes`,
`Privacy`, `Security`, `SEO`, `WooCommerce`.

### Installed separately (not committed)

| Plugin | Source |
|---|---|
| WooCommerce | wordpress.org (installed by `setup.sh`) |
| Advanced Custom Fields | wordpress.org (installed by `setup.sh`) |
| WPGraphQL | wordpress.org (installed by `setup.sh`) |
| WP Mail SMTP | wordpress.org (installed by `setup.sh`) |
| WPGraphQL for WooCommerce v0.19.0 | GitHub release (see below) |
| WPGraphQL JWT Authentication | GitHub release (see below) |
| WPGraphQL for ACF | GitHub release (see below) |

Third-party plugins are excluded by `.gitignore`. Their licenses are listed in
[THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md).

## Local development

### Requirements

- Docker Desktop (or Docker Engine + Compose)
- Node.js ≥ 22.12 (for the blocks build)
- Composer on the host, or the `composer:2` Docker image

### Quick start

```bash
cd wordpress

# 1. PHP dependencies for chronos-bridge (it stays inactive without vendor/)
docker run --rm --user "$(id -u):$(id -g)" \n  -v "$PWD/wp-content/plugins/chronos-bridge:/app" -w /app composer:2 install --no-dev

# 2. Start WordPress, MySQL and phpMyAdmin
docker-compose up -d

# 3. Install WP-CLI in the container (if missing), WordPress, the
#    wordpress.org plugins and activate the custom plugins
bash setup.sh

# 4. Install the WPGraphQL add-ons from their GitHub releases
C=wordpress-wordpress-1
docker exec $C wp plugin install --activate --force --allow-root \
  https://github.com/wp-graphql/wp-graphql-woocommerce/releases/download/v0.19.0/wp-graphql-woocommerce.zip
docker exec $C wp plugin install --activate --force --allow-root \
  https://github.com/wp-graphql/wp-graphql-jwt-authentication/releases/download/v0.7.2/wp-graphql-jwt-authentication.zip
docker exec $C wp plugin install --activate --force --allow-root \
  https://github.com/wp-graphql/wpgraphql-acf/releases/download/v2.4.1/wpgraphql-acf.zip

# 5. Sample watches, then editorial pages and the storefront menu
bash sample-data.sh
docker cp seed-connected.php $C:/tmp/seed-connected.php
docker cp ../src/content/wordpress-pages.json $C:/tmp/wordpress-pages.json
docker exec $C wp eval-file /tmp/seed-connected.php /tmp/wordpress-pages.json --allow-root

# 6. JWT signing secret for GraphQL login (random, local only, never commit)
docker exec $C wp config set GRAPHQL_JWT_AUTH_SECRET_KEY "$(openssl rand -base64 48)" --quiet --allow-root

# 7. Optional: rebuild the Gutenberg blocks (build/ is committed)
cd wp-content/plugins/chronos-blocks && npm ci && npm run build
```

Notes:

- **Products:** `sample-data.sh` creates `chronos_watch` posts for the
  `chronos/v1/watches` API and the Gutenberg blocks. It does **not** create
  WooCommerce products, which the connected storefront catalogue and checkout
  use. Add products in wp-admin → Products (or import a CSV); until then the
  connected catalogue is empty. Preview mode needs no backend.

- `setup.sh` also tries to activate the add-ons by the folder names used in
  production (`wp-graphql-jwt-authentication-0.7.0`,
  `wp-graphql-woocommerce-v0.19.0`, `wpgraphql-acf`). On a fresh clone those
  folders don't exist yet, so step 4 installs them. `setup.sh` expects JWT
  Authentication 0.7.0, which has no release zip, so the 0.7.2 zip is used.
- The official `wordpress` image has no WP-CLI; `setup.sh` downloads it
  into the container, and does so again if the container is recreated.
- **Windows performance:** `wp-content/plugins` is bind-mounted, and from a
  Windows drive each WP-CLI call took about 14 s with WooCommerce loaded
  (under 1 s with `--skip-plugins`), so `sample-data.sh` (about 100 calls)
  took 25 minutes in testing. Clone inside the WSL 2 filesystem instead; Docker's
  [WSL best practices](https://docs.docker.com/desktop/features/wsl/best-practices/)
  note that bind mounts from the Linux filesystem are much faster.
- On Git Bash for Windows, prefix the `docker` commands with
  `MSYS_NO_PATHCONV=1` so paths such as `/tmp/...` are not rewritten.
- `setup.sh` and `sample-data.sh` read `CHRONOS_WP_CONTAINER` and
  `CHRONOS_SITE_URL` if your container name or port differ.
- Step 6 writes `GRAPHQL_JWT_AUTH_SECRET_KEY` into the container's
  `wp-config.php`; without it GraphQL login fails. Existing tokens stop
  working if you change it.
- `seed-connected.php` is idempotent: it creates the editorial pages and the
  `Chronos storefront` menu only if they are missing. It is copied into the
  container because only `wp-content/plugins` and `wp-content/themes` are
  mounted.
- Stripe: enter **test** keys (`pk_test_…`, `sk_test_…`) and the webhook
  secret in wp-admin → Chronos settings. Checkout refuses to run with live keys by design.

### Local URLs and credentials

| Service | URL |
|---|---|
| WordPress | http://localhost:8888 |
| WP admin | http://localhost:8888/wp-admin |
| GraphQL | http://localhost:8888/graphql |
| REST API | http://localhost:8888/wp-json/chronos/v1/ |
| phpMyAdmin | http://localhost:8081 |

`setup.sh` creates a **local-only** admin account `admin` / `admin`, and
`docker-compose.yml` falls back to `wordpress` / `wordpress` database
credentials. These defaults are for a throwaway local container. Never use
them on a reachable server.

### Hardened compose variant

`docker-compose.secure.yml` pins image versions, adds health checks and reads
credentials from `.env.docker`:

```bash
cp .env.docker.example .env.docker   # set strong passwords
docker-compose -f docker-compose.secure.yml up -d
```

## Tests

```bash
# chronos-bridge: WordPress Coding Standards + PHPUnit (38 tests, 60 assertions)
cd wp-content/plugins/chronos-bridge
composer install
vendor/bin/phpcs --standard=phpcs.xml --warning-severity=0
vendor/bin/phpunit
composer audit

# chronos-blocks: lint, build, Jest (19 tests)
cd ../chronos-blocks
npm ci
npm run lint:js && npm run build && npm test
```

CI runs these on pushes to `main` and every pull request (`composer audit` runs in the Security workflow). On Windows, run them in WSL or
Docker if Git checked the files out with CRLF line endings (see
[CONTRIBUTING.md](../CONTRIBUTING.md#run-the-same-checks-as-ci)).

## Deployment

The project is **active on VPS hosting**:

| Part | Where |
|---|---|
| Frontend | https://chronos.zahidul-islam.com (Docker Nginx container on a VPS, behind Caddy + Cloudflare) |
| Backend | https://chronosbackend.35-222-94-93.sslip.io (Google Cloud e2-micro VM: Nginx, PHP-FPM 8.1, MySQL/MariaDB, Let's Encrypt) |

Releases are local-first: changes are made and verified locally, deployed,
and then checked with a SHA-256 local/live parity comparison.

The earlier **cPanel pipeline is retired and currently off**. It deployed
this backend to cPanel shared hosting through cPanel Git and `.cpanel.yml`,
and it worked in production until that hosting expired in May 2026. The code
is kept for reference, and its workflow jobs are disabled with
`if: ${{ false }}` so they never run.

Details, workflow states and hosting history:
[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).

## Rules for this folder

- Never commit `wp-config*.php`, `.env.docker`, `*.sql` dumps or
  `wp-content/uploads/`.
- Never commit third-party plugins; install them as shown above.
- Test GraphQL and REST changes against `http://localhost:8888` before
  opening a pull request.
