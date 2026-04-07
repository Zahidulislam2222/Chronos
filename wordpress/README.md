# Chronos — WordPress Backend

Headless WordPress + WooCommerce backend for the Chronos luxury watch e-commerce platform.

## Architecture

```
┌─────────────────┐    GraphQL / REST    ┌──────────────────────┐
│  React Frontend │◄────────────────────►│  WordPress Backend   │
│  (Vite + TS)    │                      │  (WooCommerce)       │
│  Port 8080      │                      │  Port 8888           │
└─────────────────┘                      └──────────────────────┘
                                                  │
                                         ┌────────┴────────┐
                                         │  MySQL 8.0      │
                                         │  Port 3306      │
                                         └─────────────────┘
```

## Custom Plugins

### chronos-bridge (v2.0.0)
Main plugin — OOP PHP 8+ with PSR-4 autoloading via Composer.

| Module | Description |
|--------|-------------|
| `Api/` | REST endpoints: watches, contact, Stripe checkout, webhook |
| `Admin/` | Settings page, contact submissions viewer, analytics |
| `PostTypes/` | `chronos_watch` CPT + `chronos_brand` / `chronos_movement` taxonomies |
| `Payment/` | Stripe Checkout Sessions, webhook handler with signature verification |
| `WooCommerce/` | Custom checkout fields (gift wrapping, delivery instructions) |
| `Database/` | Custom `contact_submissions` table with migrations |
| `GraphQL/` | Contact form mutation for WPGraphQL |
| `Security/` | Sanitizer, nonce helpers, capability checks |
| `Cache/` | Transients API wrapper with auto-invalidation |
| `Cron/` | Scheduled cleanup + weekly summary email |
| `I18n/` | Text domain loader + .pot file |

### chronos-blocks (v1.0.0)
Custom Gutenberg blocks built with `@wordpress/scripts`.

| Block | Description |
|-------|-------------|
| Watch Showcase | Featured watch display with image, price, CTA |
| Watch Collection Grid | Filterable grid by brand/movement, configurable columns |
| Contact Form | AJAX form submitting to `chronos/v1/contact` endpoint |

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 22+
- Composer (runs inside Docker)

### Quick Start

```bash
# 1. Start services
cd wordpress
docker-compose up -d

# 2. Run setup script (installs plugins, configures WP)
bash setup.sh

# 3. Import sample watch data
bash sample-data.sh

# 4. Install Composer deps for chronos-bridge
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && composer install"

# 5. Install npm deps for chronos-blocks
cd wp-content/plugins/chronos-blocks && npm install && npm run build
```

### URLs

| Service | URL |
|---------|-----|
| WordPress | http://localhost:8888 |
| WP Admin | http://localhost:8888/wp-admin |
| GraphQL | http://localhost:8888/graphql |
| REST API | http://localhost:8888/wp-json/chronos/v1/ |
| phpMyAdmin | http://localhost:8081 |

**Admin credentials:** admin / admin

## REST API Endpoints

### Watches
```
GET  /wp-json/chronos/v1/watches          List watches (paginated, filterable)
GET  /wp-json/chronos/v1/watches/{id}     Single watch
```

Query params: `page`, `per_page`, `brand`, `movement`, `orderby`, `order`

### Contact
```
POST /wp-json/chronos/v1/contact          Submit contact form
```

Body: `{ "name", "email", "subject", "message" }`

### Stripe
```
GET  /wp-json/chronos/v1/stripe/config           Get publishable key
POST /wp-json/chronos/v1/stripe/create-session    Create Checkout Session
POST /wp-json/chronos/v1/stripe/webhook           Stripe webhook handler
```

### Custom Checkout Fields
```
POST /wp-json/chronos/v1/checkout/custom-fields   Save gift wrapping + delivery instructions
```

## Running Tests

```bash
# PHP CodeSniffer (WordPress coding standards)
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && vendor/bin/phpcs"

# PHPUnit
docker exec wordpress-wordpress-1 bash -c \
  "cd /var/www/html/wp-content/plugins/chronos-bridge && vendor/bin/phpunit"

# Jest (Gutenberg blocks)
cd wp-content/plugins/chronos-blocks && npm test
```

## Deployment

CI/CD via GitHub Actions (`.github/workflows/ci.yml`):
1. On push to `main`: runs PHPCS, PHPUnit, Jest, frontend build
2. After tests pass: deploys plugins to cPanel via FTP

Required GitHub Secrets for deploy:
- `CPANEL_HOST` — cPanel hostname
- `CPANEL_FTP_USER` — FTP username
- `CPANEL_FTP_PASS` — FTP password
- `CPANEL_PLUGIN_PATH` — Server path to wp-content/plugins/

## Production

- **URL:** chronosbackend.healthcodeanalysis.com
- **Hosting:** AridHost cPanel
- **PHP:** 8.1+
- **Database:** MySQL 8.0
