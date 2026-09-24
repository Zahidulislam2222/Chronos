# API Reference

The frontend talks to WordPress in two ways:

- **WPGraphQL** at `/graphql`, for products, posts, pages, menus, the viewer
  and orders, provided by WPGraphQL, WPGraphQL for WooCommerce and WPGraphQL
  JWT Authentication, plus the custom `submitChronosContact` mutation.
- **REST** under the custom namespace `/wp-json/chronos/v1/`, provided by the
  `chronos-bridge` plugin.

Base URLs:

| Environment | GraphQL | REST |
|---|---|---|
| Local Docker | `http://localhost:8888/graphql` | `http://localhost:8888/wp-json/chronos/v1/` |
| Public demo backend | `https://chronosbackend.35-222-94-93.sslip.io/graphql` | `https://chronosbackend.35-222-94-93.sslip.io/wp-json/chronos/v1/` |

The public demo backend is a portfolio system on a single free-tier VM. Do not
load-test it, scan it aggressively or use it as a dependency. Run the stack
locally instead (see the [README](../README.md#getting-started)).

## Authentication

- **Public**: no credentials.
- **Customer**: `Authorization: Bearer <JWT>` obtained from the WPGraphQL JWT
  `login` mutation.
- **Admin / editor**: a WordPress user with the listed capability, via cookie
  + nonce in wp-admin or via JWT.

## REST endpoints (`/wp-json/chronos/v1/`)

### Catalogue and site content

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/watches` | Public | Paginated list. Query: `page`, `per_page`, `brand`, `movement`, `orderby` (incl. `price`), `order`. Responses are cached with transients. |
| GET | `/watches/{id}` | Public | Single watch |
| GET | `/site` | Public | Site identity and navigation for the frontend |
| GET | `/page` | Public | Published page by URI (`uri` query parameter) |
| GET | `/sitemap` | Public | XML sitemap of currently published canonical routes (proxied as `/sitemap.xml` by the frontend origin) |
| GET | `/route-status` | Public | `200` for a published route, `404` for missing or draft. Used by the frontend Nginx through an internal subrequest (`X-Chronos-Path` header). |

### Contact

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/contact` | Public, rate-limited | Body: `name`, `email`, `subject`, `message`. Returns the saved record ID. The frontend only reports success when a positive ID comes back. |
| GET | `/contact` | Admin | List submissions (`status`, `page`, `per_page`) |
| GET / PATCH / DELETE | `/contact/{id}` | Admin | Read, change status, delete |

GraphQL alternative: `submitChronosContact(input: {name, email, subject, message})`.

### Checkout (Stripe, **test mode only**)

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/stripe/config` | Public | `{available, testMode}`. `available` is true only with a `pk_test_`/`sk_test_` pair and an HTTPS frontend origin. No keys are returned. |
| POST | `/stripe/create-session` | Signed-in customer | Body: `items` (product IDs and quantities only, no prices), `requestId` (idempotency), `giftWrapping`, `deliveryInstructions`. The server resolves prices and stock, creates or reuses the order and returns the hosted Checkout URL. |
| POST | `/stripe/verify-session` | Signed-in customer | Body: `sessionId`. Checks owner, session, amount, currency and payment status against Stripe, and persists payment before returning `paid: true`. |
| POST | `/stripe/webhook` | Stripe (signature verified) | Payment event handler |
| POST | `/checkout/custom-fields` | `manage_woocommerce` | Save gift wrap and delivery instructions on an order |

### SEO and analytics

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/seo/product/{id}` | Public | Product JSON-LD |
| GET | `/seo/organization` | Public | Organisation JSON-LD |
| GET | `/analytics/config` | Public | GA4/GTM configuration. No analytics script is loaded by the current storefront. |

### AI administration (WordPress 7.0+ AI client)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/ai/generate-description` | `edit_posts` | Draft watch marketing copy |
| POST | `/ai/suggest-reply` | `manage_options` | Suggest a reply to a contact submission |
| GET | `/ai/status` | `manage_options` | Feature availability |

These admin features are retained but were **not exercised** in the verified
release (no paid AI calls were made). They degrade gracefully on WordPress
versions below 7.0.

## Errors

REST errors use the standard WordPress shape:

```json
{ "code": "rate_limited", "message": "…", "data": { "status": 429 } }
```

Common statuses: `400` validation, `401`/`403` authentication or capability,
`404` missing or draft, `409` conflicting checkout request, `429` rate limit,
`500` server error, `502` payment-provider error, `503` checkout not
configured.

## Stability

This is a portfolio project. Endpoints may change between releases; breaking
changes are recorded in [CHANGELOG.md](../CHANGELOG.md). There is no
versioned public API contract or deprecation window yet. A versioned contract
is part of the [roadmap](ROADMAP.md).
