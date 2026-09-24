# Chronos Bridge

Version 2.1.0 · GPL-2.0-or-later · PHP 8.1+

The main plugin behind the Chronos headless storefront. It is written in
object-oriented PHP 8.1+ with PSR-4 autoloading (Composer) and follows the
WordPress Coding Standards.

## Features

- **REST API** (`chronos/v1`): watches, site settings, pages, sitemap, route
  status, contact, SEO, analytics, Stripe checkout and webhook, AI helpers.
  Every route declares a `permission_callback`.
- **Custom post type** `chronos_watch` with specification meta boxes, and
  taxonomies `chronos_brand` (hierarchical) and `chronos_movement`.
- **Stripe Checkout** (test mode only): prices come from WooCommerce on the
  server, idempotency key plus request fingerprint, MySQL advisory lock, signed
  webhook verification, and payment reconciliation. Checkout refuses to run
  with live keys (the settings page accepts them, but checkout then reports
  itself unavailable).
- **Contact inbox**: custom `chronos_contact_submissions` table, rate limiting,
  admin list/update/delete, GraphQL mutation `submitChronosContact`.
- **WooCommerce**: custom checkout fields (gift wrapping, delivery notes).
- **SEO**: JSON-LD endpoints; sitemap data and route status for the
  pre-renderer (real 404s for drafts and missing routes).
- **Privacy**: WordPress personal-data exporter and eraser for contact data.
- **Caching**: transient wrapper with invalidation on updates; uses a
  persistent object cache such as Redis when one is installed.
- **Cron**: transient cleanup and a weekly contact summary email.
- **AI admin helpers**: use the WordPress 7.0 AI APIs and need WordPress
  7.0+ with a configured AI provider. Description drafts require `edit_posts`;
  contact replies require `manage_options`.
- **i18n**: `chronos-bridge` text domain with a `.pot` template.

Full endpoint list with access rules and error codes:
[docs/API.md](../../../../docs/API.md).

## Requirements

- PHP 8.1+
- WordPress with WooCommerce, WPGraphQL and the WPGraphQL add-ons (see
  [wordpress/README.md](../../../README.md))
- Composer (to generate `vendor/autoload.php`; the plugin stays inactive
  and shows an admin notice without it)

## Installation

```bash
cd wordpress/wp-content/plugins/chronos-bridge
composer install --no-dev
```

Then activate the plugin in wp-admin → Plugins, or with
`wp plugin activate chronos-bridge`. Enter Stripe **test** keys and the
webhook secret in wp-admin → Chronos settings.

## Development

```bash
composer install
composer phpcs    # WordPress Coding Standards (errors fail CI)
composer phpcbf   # auto-fix
composer test     # PHPUnit: 38 tests, 60 assertions
composer audit
```

CI runs PHPCS with `--warning-severity=0` and PHPUnit on pushes to `main`
and every pull request; the Security workflow runs `composer audit`.

## Structure

| Folder | Responsibility |
|---|---|
| `src/Admin` | Settings page, admin menus, dashboard widget |
| `src/AI` | WordPress 7.0 AI admin helpers |
| `src/Analytics` | Analytics configuration endpoint |
| `src/Api` | REST controllers: watches, contact, site, pages, sitemap, route status |
| `src/Cache` | Transient/object-cache wrapper |
| `src/Cron` | Scheduled jobs |
| `src/Database` | Contact table, statuses and migrations |
| `src/GraphQL` | `submitChronosContact` mutation |
| `src/I18n` | Text domain loading |
| `src/Payment` | Stripe checkout, webhook, reconciliation |
| `src/PostTypes` | `chronos_watch` and taxonomies |
| `src/Privacy` | Personal-data exporter and eraser |
| `src/Security` | Sanitisation, validation, nonce and capability helpers |
| `src/SEO` | JSON-LD structured data |
| `src/WooCommerce` | Checkout fields |

## License

GPL-2.0-or-later. See [LICENSE](LICENSE). Bundled Composer dependencies keep
their own licenses (for example `stripe/stripe-php`, MIT); see
[THIRD-PARTY-NOTICES.md](../../../../THIRD-PARTY-NOTICES.md).

## Author

**Zahidul Islam** — [GitHub](https://github.com/Zahidulislam2222)
