<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/WordPress-7.0-21759B?style=flat-square&logo=wordpress" alt="WordPress" />
  <img src="https://img.shields.io/badge/PHP-8.1+-777BB4?style=flat-square&logo=php" alt="PHP 8.1+" />
  <img src="https://img.shields.io/badge/WooCommerce-10.6-96588A?style=flat-square&logo=woocommerce" alt="WooCommerce" />
  <img src="https://img.shields.io/badge/Stripe-Integrated-635BFF?style=flat-square&logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/License-GPL--2.0-green?style=flat-square" alt="License" />
</p>

# Chronos

**Headless WordPress e-commerce for luxury watches.**

A decoupled architecture where a React SPA frontend communicates with a WordPress + WooCommerce backend via GraphQL and REST APIs. Built to demonstrate senior-level full-stack WordPress development.

<p align="center">
  <a href="https://chronos.healthcodeanalysis.com">Live Demo</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#api-reference">API Reference</a>
</p>

---

## Architecture

```
                         GraphQL / REST API
  ┌──────────────────┐ ◄──────────────────────► ┌──────────────────────┐
  │                  │                           │                      │
  │  React Frontend  │                           │  WordPress Backend   │
  │  Vite + TS       │                           │  WooCommerce         │
  │  Tailwind CSS    │                           │  WPGraphQL           │
  │                  │                           │                      │
  │  Vercel          │                           │  cPanel / Docker     │
  └──────────────────┘                           └──────────┬───────────┘
                                                            │
                                                  ┌─────────┴─────────┐
                                                  │    MySQL 8.0      │
                                                  └───────────────────┘
```

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind | SPA with code splitting, SEO meta tags, Stripe.js |
| **Backend** | WordPress 7.0, WooCommerce, PHP 8.1+ | Headless CMS, product management, order processing |
| **API** | WPGraphQL, REST API (custom) | Product queries, checkout, payments, AI features |
| **Database** | MySQL 8.0 | WooCommerce data + custom contact submissions table |
| **DevOps** | Docker, GitHub Actions, Vercel, cPanel | Local dev, CI/CD, deployment |

---

## Features

### Custom Plugins

**chronos-bridge** (v2.0.0) — 22+ OOP PHP 8+ classes with Composer PSR-4 autoloading

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

- **Code splitting** — 9 lazy-loaded routes via `React.lazy`
- **SEO** — react-helmet-async (OG, Twitter Card, JSON-LD)
- **Payments** — Real Stripe Checkout redirect flow
- **Auth** — JWT stateless authentication
- **A11y** — WCAG 2.1 AA (skip-to-content, ARIA landmarks, focus management)
- **GDPR** — Cookie consent banner

### WordPress 7.0 AI Integration

- **Generate Description** button on watch edit screen
- AI-powered contact form auto-responder (sentiment + intent analysis)
- Registered as WordPress Abilities (discoverable by AI agents)
- Graceful degradation on WP < 7.0

---

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 22+
- Git

### Quick Start

```bash
# Clone
git clone https://github.com/Zahidulislam2222/Chronos.git
cd Chronos

# Start WordPress backend
cd wordpress
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
npm install
npm run dev
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| WordPress Admin | http://localhost:8888/wp-admin |
| REST API | http://localhost:8888/wp-json/chronos/v1/ |
| GraphQL | http://localhost:8888/graphql |
| phpMyAdmin | http://localhost:8081 |

Admin login: `admin` / `admin`

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
GET  /stripe/config        Publishable key for frontend
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

# PHPUnit (33 tests, 47 assertions)
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && vendor/bin/phpunit"

# Jest (19 tests — Gutenberg blocks)
cd wordpress/wp-content/plugins/chronos-blocks && npm test

# Frontend build
npm run build
```

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, react-helmet-async |
| **Backend** | PHP 8.1+, WordPress 7.0, WooCommerce, WPGraphQL, Stripe PHP SDK |
| **Database** | MySQL 8.0, custom tables via dbDelta |
| **Testing** | PHPUnit, Jest, PHPCS (WordPress standards) |
| **DevOps** | Docker, GitHub Actions, Vercel, cPanel |
| **Security** | JWT auth, nonces, prepared statements, webhook signatures, CORS |

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
│       │   │   ├── Privacy/      # GDPR compliance
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
└── .github/
    ├── workflows/ci.yml          # CI/CD pipeline
    └── PULL_REQUEST_TEMPLATE.md
```

---

## License

GPL-2.0-or-later

---

<p align="center">
  Built by <a href="https://github.com/Zahidulislam2222">Zahidul Islam</a>
</p>
