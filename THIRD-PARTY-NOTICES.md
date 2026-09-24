# Third-Party Notices and Licensing

Chronos is open source. Different parts of the repository use different
licenses.

## Licenses in this repository

| Path | License | Copyright |
|---|---|---|
| Everything not listed below (React frontend in `src/`, `scripts/`, `config/`, `deploy/`, docs) | MIT, see [LICENSE](LICENSE) | © 2026 Zahidul Islam |
| `wordpress/wp-content/plugins/chronos-bridge/` | GPL-2.0-or-later, see its [LICENSE](wordpress/wp-content/plugins/chronos-bridge/LICENSE) | © 2026 Zahidul Islam |
| `wordpress/wp-content/plugins/chronos-blocks/` | GPL-2.0-or-later, see its [LICENSE](wordpress/wp-content/plugins/chronos-blocks/LICENSE) | © 2026 Zahidul Islam |
| `wordpress/wp-content/plugins/wp-graphql-cors-master/` | GPL-3.0, see its [LICENSE](wordpress/wp-content/plugins/wp-graphql-cors-master/LICENSE) | Geoff Taylor, Drew Baker and contributors — upstream: <https://github.com/kidunot89/wp-graphql-cors> |

The two Chronos WordPress plugins are licensed GPL-2.0-or-later, matching
WordPress itself. The frontend is MIT and talks to WordPress only over HTTP
APIs.

## Dependencies installed at build or run time (not stored here)

| Component | License | Installed from |
|---|---|---|
| WordPress | GPL-2.0-or-later | wordpress.org |
| WooCommerce | GPL-3.0-or-later | wordpress.org |
| WPGraphQL, WPGraphQL for WooCommerce, WPGraphQL JWT Authentication | GPL-3.0 | wordpress.org / GitHub releases |
| Advanced Custom Fields | GPL-2.0-or-later | wordpress.org |
| WPGraphQL for ACF | GPL-3.0 | GitHub releases |
| WP Mail SMTP | GPL-3.0-or-later | wordpress.org |
| stripe/stripe-php | MIT | Packagist |
| npm packages (React, Vite, Radix UI, TanStack Query, Tailwind CSS, Framer Motion, DOMPurify, Zod and others) | Mostly MIT/ISC/Apache-2.0; see each package's `LICENSE` in `node_modules` | npm registry |

Use `npx license-checker --summary` in the root and in
`wordpress/wp-content/plugins/chronos-blocks/` for a full npm license report.

## Media and brand

- Campaign images and films are AI-generated illustrations of fictional
  products, created for this project. See the AI-media notes in
  [docs/COMPLIANCE.md](docs/COMPLIANCE.md).
- "Chronos" is used as a demo project name. No affiliation with any real
  watch brand is implied. Product names, prices and specifications are
  fictional.
- Third-party names (WordPress, WooCommerce, Stripe, Cloudflare, Google
  Cloud, GitHub) are trademarks of their owners and are used only to describe
  compatibility.
