<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/WordPress-7.0-21759B?style=flat-square&logo=wordpress" alt="WordPress" />
  <img src="https://img.shields.io/badge/PHP-8.1+-777BB4?style=flat-square&logo=php" alt="PHP 8.1+" />
  <img src="https://img.shields.io/badge/WooCommerce-10.7-96588A?style=flat-square&logo=woocommerce" alt="WooCommerce" />
  <img src="https://img.shields.io/badge/Stripe-Integrated-635BFF?style=flat-square&logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/CI-Manual-blue?style=flat-square&logo=github-actions" alt="CI" />
  <img src="https://img.shields.io/badge/Deploy-VPS_%2B_Cloudflare-blue?style=flat-square&logo=googlecloud" alt="Deploy" />
  <img src="https://img.shields.io/badge/Security-Dependabot-brightgreen?style=flat-square&logo=dependabot" alt="Dependabot" />
</p>

# Chronos

**Headless WordPress e-commerce for luxury watches.**

A decoupled architecture where a React SPA frontend communicates with a WordPress + WooCommerce backend via GraphQL and REST APIs. Built to demonstrate senior-level full-stack WordPress development.

<p align="center">
  <a href="https://chronos.zahidul-islam.com">Live Demo</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#api-reference">API Reference</a>
</p>

---

The [live connected demo](https://chronos.zahidul-islam.com) combines the accepted cinematic design with WordPress products, posts, pages and navigation. Login, order history, contact persistence and hosted Stripe **test** checkout work against the backend. No physical goods or live charges are offered. Administrator access is supplied privately.

## Engineering evidence

The current demo uses pre-rendered HTML, route-specific metadata, an XML sitemap, website/page/article metadata and connected Product structured data without merchant offers, and a constrained frontend runtime connected to WordPress APIs. The browser policy restricts scripts, frames, forms and device capabilities. Dependency, browser, accessibility, release-integrity and recovery checks are documented separately from untested production claims.

- [Scalability and availability architecture](docs/SCALABILITY.md): stateless delivery, cache assumptions, a staged path toward **10k–1M concurrent readers**, and a **99% availability objective**. These are design targets, not verified current capacity or an SLA.
- [Search, security and US/EU legal review](docs/SEARCH-SECURITY-LEGAL-REVIEW.md): cited applicability matrix, implemented demo controls, and obligations before real commerce.
- [Security operations](docs/SECURITY-OPERATIONS.md): boundaries, verification commands and operating limitations.
- [Verified release evidence](docs/VERIFICATION.md): dated gate results, reproduction commands and explicit limits.
- [Public technical overview](https://docs.google.com/document/d/1vxOa2xT6dvLN1q8Mq0SWtN-BQWNdMcTfV9PLyzMkM5Y): current client/developer reference, updated in place.

## Architecture

The public frontend is connected to the existing WordPress/WooCommerce backend. CMS changes appear through API reads and the live sitemap without rebuilding; initial HTML snapshots refresh on rebuild.

```
                         GraphQL / REST API
  ┌──────────────────┐ ◄──────────────────────► ┌──────────────────────┐
  │                  │                           │                      │
  │  React Frontend  │                           │  WordPress Backend   │
  │  Vite + TS       │                           │  WooCommerce         │
  │  Tailwind CSS    │                           │  WPGraphQL           │
  │                  │                           │                      │
  │  VPS / Cloudflare│                           │  WordPress / PHP / DB│
  └──────────────────┘                           └──────────┬───────────┘
                                                            │
                                                  ┌─────────┴─────────┐
                                                  │    MySQL / MariaDB │
                                                  └───────────────────┘
```

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind | Pre-rendered pages, current CMS reads, code splitting and test commerce |
| **Backend** | WordPress 7.0, WooCommerce, PHP 8.1+ | Headless CMS, product management, order processing |
| **API** | WPGraphQL, REST API (custom) | Product queries, checkout, payments, AI features |
| **Database** | MariaDB | WooCommerce data + custom contact submissions table |
| **DevOps** | Docker, Caddy, Cloudflare, GitHub Actions | Versioned connected frontend releases; manually guarded workflows |

---

## Features

### Custom Plugins

**chronos-bridge** (v2.1.0) — 22+ OOP PHP 8+ classes with Composer PSR-4 autoloading

| Module | What it does |
|--------|-------------|
| `Api/` | REST endpoints — watches, contact form, Stripe checkout, webhooks |
| `Payment/` | Stripe Checkout Sessions, webhook signature verification |
| `WooCommerce/` | Custom checkout fields (gift wrapping, delivery instructions) |
| `PostTypes/` | `chronos_watch` CPT + brand/movement taxonomies |
| `AI/` | WP 7.0 AI Client — description generator, contact auto-responder |
| `SEO/` | JSON-LD structured data (Product, Organization, Breadcrumb) |
| `Analytics/` | Google Analytics 4 / GTM integration |
| `Database/` | Custom tables with migrations, CRUD, rate limiting |
| `Security/` | Sanitizer, nonces, capability checks, input validation |
| `Cache/` | Transients + Redis-ready ObjectCacheCompat |
| `Privacy/` | GDPR data exporter + eraser (WordPress Privacy API) |
| `Admin/` | Settings page, contact viewer, dashboard widget |

**chronos-blocks** (v1.0.0) — 3 custom Gutenberg blocks

| Block | Description |
|-------|-------------|
| Watch Showcase | Featured watch with InspectorControls, SSR |
| Collection Grid | Filterable grid by brand/movement/price |
| Contact Form | AJAX submission with client-side validation |

### Frontend Highlights

- **Code splitting** — Lazy-loaded route screens via `React.lazy`
- **SEO** — react-helmet-async (OG, Twitter Card, JSON-LD)
- **Payments** — Hosted Stripe test checkout with verified WooCommerce persistence
- **Auth** — JWT stateless authentication
- **A11y** — Skip navigation, labels and focus management; six public axe scans found zero violations, without claiming full WCAG conformance
- **Privacy** — Connected-data notice and storage controls; retained CookieConsent component is not mounted and is not a compliance claim
- **Legal** — Privacy Policy, Terms of Service pages

### Retained AI administration (not exercised in this recovery)

- **Generate Description** button on watch edit screen
- AI-powered contact form auto-responder (sentiment + intent analysis)
- Registered as WordPress Abilities (discoverable by AI agents)
- Graceful degradation on WP < 7.0

---

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 22.13+ (Node 24 used for the verified release)
- Git

### Optional isolated preview

The optional local preview needs no backend. The public deployment uses connected mode.

```bash
npm ci
npx playwright install chromium
cp .env.example .env.production.local
# In that ignored file: set both API URLs empty, keep preview mode,
# set the canonical site origin, and enable indexing only for an approved public release.
npm run typecheck
npm run build
npm run verify:release
npm run preview
```

`npm run capacity:model` prints explicit workload assumptions. `npm run monitor:once` records one HTTPS observation; schedule it externally for actual availability measurement. Neither command is a load-capacity or uptime guarantee. The local-only load tool is retained under ignored `tests/` for this workspace; it is not a published distributed-load service.

### Connected-backend setup

Set `VITE_STOREFRONT_MODE=connected`, the GraphQL/WordPress/public site origins and all documented settings in the ignored production environment file. The public deployment uses existing hosts; the Docker commands below are an optional local setup. Real customers and live payments need separate commercial-launch verification.


```bash
# Clone
git clone https://github.com/Zahidulislam2222/Chronos.git
cd Chronos

# Start WordPress backend
cd wordpress
cp .env.docker.example .env.docker   # edit if needed
docker-compose up -d
bash setup.sh          # Auto-installs WP + plugins
bash sample-data.sh    # Imports 8 sample watches

# Install plugin dependencies
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && composer install"

cd wp-content/plugins/chronos-blocks
npm install && npm run build
cd ../../../..

# Start React frontend
cp .env.example .env.local   # set VITE_API_URL=http://localhost:8888/graphql
npm install
npm run dev
```

### Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| WordPress Admin | http://localhost:8888/wp-admin |
| REST API | http://localhost:8888/wp-json/chronos/v1/ |
| GraphQL | http://localhost:8888/graphql |
| phpMyAdmin | http://localhost:8081 |

Local admin credentials are set by `setup.sh` (see `wordpress/setup.sh`).

---

## API Reference

All endpoints under `/wp-json/chronos/v1/`

### Watches
```
GET  /watches              List (paginated, filterable by brand/movement/price)
GET  /watches/:id          Single watch details
```

### Contact
```
POST /contact              Submit contact form (rate-limited)
```

### Payments (Stripe)
```
GET  /stripe/config        Checkout availability and test-mode status
POST /stripe/create-session  Create Checkout Session
POST /stripe/webhook       Webhook handler (signature verified)
POST /checkout/custom-fields  Save gift wrapping + delivery instructions
```

### SEO & Analytics
```
GET  /seo/product/:id      Product JSON-LD schema
GET  /seo/organization     Organization schema
GET  /analytics/config     GA4/GTM configuration
```

### AI (WordPress 7.0+)
```
POST /ai/generate-description  Generate watch marketing copy
POST /ai/suggest-reply         Suggest reply for contact submission
GET  /ai/status                Feature availability check
```

---

## Testing

```bash
# PHP CodeSniffer (WordPress coding standards)
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && vendor/bin/phpcs"

# PHPUnit (38 tests, 60 assertions)
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && vendor/bin/phpunit"

# Jest (19 tests — Gutenberg blocks)
cd wordpress/wp-content/plugins/chronos-blocks && npm test

# Frontend build
npm run build
```

---

## Deployment

**Current frontend:** [chronos.zahidul-islam.com](https://chronos.zahidul-islam.com), served by Nginx on an existing VPS behind Caddy HTTPS and Cloudflare. The accepted cinematic demo was deployed on 2026-09-14. Public browser checks cover the catalogue, gallery, shopping bag, responsive films, keyboard flows and media recovery. No live commerce is enabled.

Deployment configuration lives in `deploy/shared-vps/`. Releases are built locally, staged in a new versioned directory, validated, and compared against the live files by SHA-256. HTML uses `no-transform` to preserve the original page through the CDN. Private access, release ownership and rollback records are maintained outside tracked source.

**Retained deployment workflows:** the existing GCP/Cloudflare Pages workflows are historical paths, not the current connected deployment. They are manual and guarded by `workflow_dispatch` and `CHRONOS_ACTIONS_ENABLED`; no workflow was enabled or run for this deployment.

**Retained backend pipeline** (not migrated or executed for the static demo) (GitHub Actions → GCP via SSH + rsync):

```
Manual dispatch (guarded by CHRONOS_ACTIONS_ENABLED)
    │
    ▼
GitHub Actions CI Pipeline
    ├── PHP Tests (PHPCS + PHPUnit)
    ├── Blocks Build & Tests (Jest)
    ├── Frontend Build (Vite)
    │
    ▼ (all pass)
deploy-gcp          → SSH + rsync custom plugins to GCP e2-micro
deploy-frontend     → wrangler pages deploy dist/ to Cloudflare Pages
verify              → Health-check GraphQL + frontend URLs
```

**Security:**
- SSH deployment credentials are supplied through private configuration
- Retained workflows expect the GitHub Actions secrets listed below
- Frontend release contains no privileged application credentials
- Dependabot scans dependencies weekly
- Let's Encrypt SSL (auto-renews)
- Current demo sends X-Content-Type-Options, X-Frame-Options and Referrer-Policy headers

**Required GitHub Secrets:**

| Secret | Purpose |
|--------|---------|
| `GCP_SSH_PRIVATE_KEY` | SSH key for GCP server |
| `GCP_HOST` | GCP server IP |
| `CF_WRANGLER_CONFIG` | Cloudflare Wrangler OAuth config (auto-rotated by CI) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier |
| `GH_PAT` | GitHub PAT used by CI to rotate the Wrangler config |

**Historical manual workflow:** "Deploy to Production" targets the retained infrastructure. Do not use it to update the current VPS frontend; use the versioned local-first release process above.

### Previous Infrastructure — cPanel (Preserved as Portfolio Reference)

The original deployment used AridHost cPanel with a full cPanel API integration pipeline. That code is **intentionally preserved** in `scripts/ci-deploy.py`, `scripts/deploy.sh`, and the `deploy-cpanel-legacy` job in `ci.yml` (muted with `if: false`). It demonstrates:

- cPanel UAPI integration (Git pull trigger, Fileman API for file upload)
- SSH deploy key workflow without passwords
- Custom Python CI orchestration script

The cPanel infrastructure is no longer active (hosting expired), but the implementation is kept intact as a reference and proof of prior work.

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, react-helmet-async |
| **Backend** | PHP 8.1+, WordPress 7.0, WooCommerce, WPGraphQL, Stripe PHP SDK |
| **Database** | MariaDB, custom tables via dbDelta |
| **Testing** | PHPUnit, Jest, PHPCS (WordPress standards) |
| **DevOps** | Docker, Caddy, existing frontend/backend hosts, Cloudflare, manual GitHub Actions |
| **Security** | JWT auth, nonces, prepared statements, webhook signatures, CORS, CSP headers |

---

## Project Structure

```
chronos/
├── src/                          # React frontend
│   ├── components/               # UI components (Layout, SEOHead, CookieConsent, ...)
│   ├── pages/                    # Route pages (Shop, Checkout, ProductDetail, ...)
│   ├── context/                  # React Context (Cart, Auth)
│   └── utils/                    # API utilities, GraphQL queries
├── wordpress/
│   ├── docker-compose.yml        # Local development
│   ├── setup.sh                  # Auto-install script
│   ├── sample-data.sh            # Sample watch data
│   ├── .htaccess.sample          # Production security/caching config
│   └── wp-content/plugins/
│       ├── chronos-bridge/       # Main custom plugin (22+ PHP classes)
│       │   ├── src/              # PSR-4 autoloaded classes
│       │   │   ├── Admin/        # Settings, dashboard widget
│       │   │   ├── AI/           # WP 7.0 AI integration
│       │   │   ├── Analytics/    # GA4/GTM tracking
│       │   │   ├── Api/          # REST endpoints
│       │   │   ├── Cache/        # Transients + Redis-ready
│       │   │   ├── Cron/         # Scheduled tasks
│       │   │   ├── Database/     # Custom tables, migrations
│       │   │   ├── GraphQL/      # WPGraphQL mutations
│       │   │   ├── I18n/         # Internationalization
│       │   │   ├── Payment/      # Stripe integration
│       │   │   ├── PostTypes/    # CPT + taxonomies
│       │   │   ├── Privacy/      # WordPress privacy hooks (not a compliance certification)
│       │   │   ├── SEO/          # JSON-LD structured data
│       │   │   ├── Security/     # Sanitization, nonces
│       │   │   └── WooCommerce/  # Custom checkout fields
│       │   ├── tests/            # PHPUnit tests
│       │   ├── composer.json
│       │   └── phpcs.xml
│       └── chronos-blocks/       # Gutenberg blocks plugin
│           ├── src/              # Block source (JSX + SCSS)
│           ├── build/            # Compiled blocks
│           ├── tests/            # Jest tests
│           └── package.json
├── scripts/
│   ├── gcp-deploy.sh             # CI: rsync plugins to GCP via SSH
│   ├── gcp-setup.sh              # Reference: full GCP server setup
│   ├── nginx-chronos.conf        # Nginx virtual host config reference
│   ├── prepare-db.py             # DB migration: URL replacement script
│   ├── deploy.sh                 # Legacy: cPanel deployment (proof of work)
│   └── ci-deploy.py              # Legacy: cPanel API deploy (proof of work)
└── .github/
    ├── workflows/
    │   ├── ci.yml                # CI pipeline (test → deploy to GCP + Cloudflare Pages)
    │   ├── security.yml          # npm audit + composer audit
    │   └── deploy.yml            # Manual deploy with dry-run
    ├── dependabot.yml            # Weekly dependency scanning
    └── PULL_REQUEST_TEMPLATE.md
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built by <a href="https://github.com/Zahidulislam2222">Zahidul Islam</a>
</p>
