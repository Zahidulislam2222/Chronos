# Chronos Bridge

Custom WordPress plugin for the Chronos luxury watch e-commerce platform. Built with **OOP PHP 8.1+**, PSR-4 autoloading, WordPress coding standards, and comprehensive testing.

## Features

- **Custom Post Type** — `chronos_watch` with meta boxes for watch specifications
- **Custom Taxonomies** — Brand (hierarchical) and Movement Type (non-hierarchical)
- **REST API** — `chronos/v1/watches` and `chronos/v1/contact` endpoints
- **GraphQL Mutation** — `submitChronosContact` for headless frontend contact forms
- **Admin Settings** — Settings API integration with rate limiting, email config, analytics
- **Custom Database Table** — `chronos_contact_submissions` with full CRUD
- **Security** — Centralized sanitization, nonce verification, capability checks, rate limiting
- **Caching** — Transients API wrapper with auto-invalidation on post updates
- **Cron Jobs** — Daily transient cleanup, weekly contact summary emails
- **i18n** — Full internationalization with `.pot` translation template

## Requirements

- PHP 8.1+
- WordPress 6.4+
- Composer

## Installation

```bash
cd wordpress/wp-content/plugins/chronos-bridge
composer install
```

Activate the plugin in WordPress Admin > Plugins.

## Development

```bash
# Run coding standards check
composer phpcs

# Auto-fix coding standards
composer phpcbf

# Run tests
composer test
```

## REST API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wp-json/chronos/v1/watches` | Public | List watches with pagination/filtering |
| GET | `/wp-json/chronos/v1/watches/{id}` | Public | Get single watch |
| POST | `/wp-json/chronos/v1/contact` | Public | Submit contact form |
| GET | `/wp-json/chronos/v1/contact` | Admin | List contact submissions |
| PATCH | `/wp-json/chronos/v1/contact/{id}` | Admin | Update submission status |
| DELETE | `/wp-json/chronos/v1/contact/{id}` | Admin | Delete submission |

## Author

**Zahidul Islam** — [GitHub](https://github.com/Zahidulislam2222)
