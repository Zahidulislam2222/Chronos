# Chronos Portfolio Upgrade — Build Plan

> **Purpose:** Rebuild Chronos to demonstrate senior WordPress developer skills.
> **Owner:** Zahidul Islam (Zahidulislam2222)
> **Started:** 2026-04-07
> **Source:** Ultraplan gap analysis comparing Chronos against senior WP job requirements.

## HOW TO USE THIS FILE

**For any AI agent (Claude Code) picking up this work:**
1. Read this file FIRST before doing anything
2. Find the first unchecked `[ ]` task — that's where to start
3. Each task has exact files to create/edit and what to put in them
4. After completing a task, mark it `[x]`
5. If a phase is partially done, look for the first `[ ]` within that phase
6. Do NOT skip ahead to later phases — they depend on earlier ones

**MANDATORY: After EVERY phase completion:**
1. Run ALL available tests (phpcs, phpunit, npm test, npm run build — whatever applies)
2. Run verification steps listed at the end of the phase
3. ALL tests must PASS before moving to next phase
4. If tests fail — fix them FIRST, do not proceed
5. Update the PROGRESS TRACKER table at the bottom (change status to DONE + date)
6. Commit with a descriptive message
7. THEN move to next phase

**For the user:**
- Check progress by looking at the checkboxes below
- Each phase ends with a verification step you can test yourself

---

## ITEMS EXCLUDED FROM THIS PLAN (don't belong in Chronos)

These are separate projects/skills, NOT part of this build:
- Page Builders (Elementor, Divi) — Chronos is headless, no WP theme
- Shopify/Webflow — separate platforms entirely
- WordPress Multisite — Chronos is single-site
- FSE theme / theme.json — Chronos is headless, no WP theme rendering
- Publish to wordpress.org — chronos-bridge is project-specific, build a separate general-purpose plugin for that
- HubSpot/CRM — only if targeting specific agency jobs later

---

## Phase 1: FIX CRITICAL SECURITY & CREDIBILITY ISSUES

> **Goal:** Remove anything that would instantly disqualify you.
> **No code writing — just cleanup.**

- [x] **1.1** Change plugin author from "Vibe Coder" to "Zahidul Islam"
  - File: `wordpress/wp-content/plugins/chronos-bridge/chronos-bridge.php`
  - Line 7: Change `Author: Vibe Coder` → `Author: Zahidul Islam`
  - Also add: `Author URI: https://github.com/Zahidulislam2222`

- [x] **1.2** Remove fake Stripe checkout UI
  - File: `src/pages/Checkout.tsx`
  - The Stripe card form is a visual mockup (no real Stripe.js/API calls)
  - Replace with a clean "Payment integration coming soon" message OR remove checkout entirely
  - Keep cart functionality — just remove the fake payment form
  - Check `src/components/CartDrawer.tsx` for any fake payment links

- [x] **1.3** Verify sensitive files are gitignored (already done but double-check)
  - Run: `git ls-files | grep -E "(wp-config|\.sql)"`
  - Should return nothing. If it returns files, run `git rm --cached <file>`

- [x] **1.4** Commit Phase 1 changes
  - Message: "fix: remove fake payment UI and update plugin author credentials"

**Verification:** `git log --oneline -1` shows the commit. Plugin header shows real name. Checkout page has no fake card form.

---

## Phase 2: REBUILD PLUGIN AS SENIOR-LEVEL OOP PHP 8+

> **Goal:** Rewrite chronos-bridge from 63-line procedural script into a professional OOP plugin with Composer, namespaces, PSR-4, admin settings, security, and i18n.
> **Target:** 2000+ lines of production-quality code.

### 2A: Plugin skeleton with Composer + PSR-4

- [x] **2A.1** Create Composer setup
  - Create: `wordpress/wp-content/plugins/chronos-bridge/composer.json`
  - Namespace: `ChronosBridge\`
  - PSR-4 autoload: `"ChronosBridge\\": "src/"`
  - Require PHP 8.1+
  - Require-dev: phpunit, phpcs with WordPress coding standards

- [x] **2A.2** Create plugin directory structure
  ```
  chronos-bridge/
  ├── chronos-bridge.php          (main plugin file — bootstrap only)
  ├── composer.json
  ├── src/
  │   ├── Plugin.php              (main plugin class, singleton)
  │   ├── Admin/
  │   │   ├── AdminMenu.php       (settings pages)
  │   │   └── Settings.php        (Settings API integration)
  │   ├── PostTypes/
  │   │   ├── WatchCollection.php (Custom Post Type)
  │   │   └── Taxonomy.php        (Custom Taxonomies: brand, movement-type)
  │   ├── Api/
  │   │   ├── RestController.php  (REST API base)
  │   │   ├── ContactEndpoint.php (POST /wp-json/chronos/v1/contact)
  │   │   └── WatchEndpoint.php   (GET /wp-json/chronos/v1/watches)
  │   ├── GraphQL/
  │   │   └── ContactMutation.php (existing contact form, moved here)
  │   ├── Database/
  │   │   ├── Migrator.php        (custom table creation via $wpdb)
  │   │   └── ContactTable.php    (store contact submissions in DB)
  │   ├── Security/
  │   │   └── Sanitizer.php       (centralized sanitization + nonce helpers)
  │   ├── Cache/
  │   │   └── TransientCache.php  (Transients API wrapper)
  │   ├── Cron/
  │   │   └── CleanupJob.php      (wp_cron scheduled tasks)
  │   └── I18n/
  │       └── Loader.php          (load text domain, .pot generation)
  ├── languages/
  │   └── chronos-bridge.pot      (translation template)
  ├── templates/
  │   └── admin/
  │       └── settings-page.php   (admin settings HTML)
  ├── tests/
  │   ├── bootstrap.php
  │   ├── Unit/
  │   │   ├── SanitizerTest.php
  │   │   └── ContactTableTest.php
  │   └── Integration/
  │       └── RestApiTest.php
  ├── phpunit.xml
  ├── phpcs.xml                   (WordPress coding standards config)
  └── README.md
  ```

- [x] **2A.3** Rewrite main plugin file as bootstrap only
  - `chronos-bridge.php` should ONLY: check PHP version, require autoloader, call `Plugin::init()`
  - All logic moves to `src/` classes
  - Plugin header: Author: Zahidul Islam, Requires PHP: 8.1, Version: 2.0.0

- [x] **2A.4** Create Plugin.php singleton class
  - Registers all hooks via `add_action` / `add_filter`
  - Loads all modules (Admin, PostTypes, Api, GraphQL, Database, Cache, Cron, I18n)
  - Uses PHP 8+ features: constructor promotion, named arguments, match expressions, union types, enums

### 2B: Custom Post Types + Taxonomies

- [x] **2B.1** Create WatchCollection custom post type
  - Post type: `chronos_watch` with labels, supports (title, editor, thumbnail, custom-fields)
  - Admin columns: Brand, Movement Type, Price, Stock Status
  - Meta boxes for watch-specific data (case diameter, water resistance, etc.)

- [x] **2B.2** Create custom taxonomies
  - `chronos_brand` (hierarchical, like categories) — Rolex, Omega, Patek Philippe, etc.
  - `chronos_movement` (non-hierarchical, like tags) — Automatic, Manual, Quartz

### 2C: REST API endpoints

- [x] **2C.1** Create REST API base controller
  - Namespace: `chronos/v1`
  - Permission callbacks with `current_user_can()` checks
  - Nonce verification via `wp_verify_nonce()`

- [x] **2C.2** Create contact form endpoint
  - `POST /wp-json/chronos/v1/contact`
  - Input sanitization (sanitize_text_field, sanitize_email, wp_kses)
  - Rate limiting via transients
  - Store submission in custom DB table + send email

- [x] **2C.3** Create watches endpoint
  - `GET /wp-json/chronos/v1/watches` — list with pagination, filtering by brand/movement
  - `GET /wp-json/chronos/v1/watches/{id}` — single watch details

### 2D: Custom database table

- [x] **2D.1** Create Migrator class
  - Uses `$wpdb->prefix` for table name
  - `dbDelta()` for safe schema creation/updates
  - Runs on plugin activation hook

- [x] **2D.2** Create contact_submissions table
  - Columns: id, name, email, subject, message, ip_address, submitted_at, status (new/read/replied)
  - CRUD methods via $wpdb (prepare statements for SQL injection prevention)

### 2E: Admin settings page

- [x] **2E.1** Create admin menu + settings page
  - Top-level menu: "Chronos" with dashicon
  - Sub-pages: Settings, Contact Submissions, Watch Analytics
  - Uses WordPress Settings API (register_setting, add_settings_section, add_settings_field)

- [x] **2E.2** Settings fields
  - Contact form recipient email (default: admin_email)
  - Enable/disable rate limiting
  - API rate limit (requests per minute)
  - Enable/disable email notifications
  - Google Analytics tracking ID

### 2F: Security hardening

- [x] **2F.1** Create Sanitizer class
  - Static methods for common sanitization patterns
  - Nonce creation + verification helpers
  - Capability check helpers
  - Input validation (email, phone, URL patterns)

- [x] **2F.2** Apply security to all existing code
  - Every form: nonce field + verification
  - Every user input: sanitize before use
  - Every DB query: `$wpdb->prepare()`
  - Every admin page: `current_user_can('manage_options')`
  - Every REST endpoint: permission callback

### 2G: Internationalization (i18n)

- [x] **2G.1** Create I18n loader
  - Load text domain: `chronos-bridge`
  - Wrap all user-facing strings with `__()` or `_e()`
  - Generate .pot file

### 2H: Caching + Cron

- [x] **2H.1** TransientCache wrapper
  - Cache expensive queries (watch listings, contact count)
  - Auto-invalidate on post save/update

- [x] **2H.2** Cron cleanup job
  - Daily cron to clean old transients
  - Weekly cron to email contact submission summary to admin

### 2I: Coding standards + testing

- [x] **2I.1** Configure PHPCS with WordPress standards
  - `phpcs.xml` targeting `src/` directory
  - Run: `vendor/bin/phpcs` — must pass with 0 errors

- [x] **2I.2** Write PHPUnit tests (minimum 10)
  - Unit tests: Sanitizer, ContactTable CRUD, TransientCache
  - Integration tests: REST API endpoints return correct responses

- [x] **2I.3** Commit Phase 2
  - Message: "feat: rebuild chronos-bridge as OOP PHP 8+ plugin with REST API, CPT, security, i18n, and tests"

**Verification:**
- `composer install` works
- `vendor/bin/phpcs` passes
- `vendor/bin/phpunit` passes with 10+ tests
- Plugin activates without errors in WordPress admin
- REST API: `curl localhost:8888/wp-json/chronos/v1/watches` returns data
- Admin > Chronos settings page loads

---

## Phase 3: GUTENBERG CUSTOM BLOCKS

> **Goal:** Build 2-3 custom Gutenberg blocks using @wordpress/scripts + React/JSX.

- [x] **3.1** Set up block development environment
  - Create: `wordpress/wp-content/plugins/chronos-blocks/` (separate plugin)
  - Use `@wordpress/create-block` or manual `@wordpress/scripts` setup
  - `package.json` with build/start scripts

- [x] **3.2** Build "Watch Showcase" block
  - Displays a featured watch with image, name, price, and CTA button
  - Uses `InspectorControls` for sidebar settings
  - Fetches watch data from REST API (`chronos/v1/watches`)
  - Styled for Gutenberg editor + frontend

- [x] **3.3** Build "Watch Collection Grid" block
  - Displays grid of watches filtered by brand or movement type
  - Uses `@wordpress/data` for API fetching
  - Configurable columns, sorting, and limit

- [x] **3.4** Build "Contact Form" block
  - Renders contact form in Gutenberg
  - Submits to `chronos/v1/contact` REST endpoint
  - Client-side validation + AJAX submission
  - Success/error states

- [x] **3.5** Add `@wordpress/i18n` to all blocks

- [x] **3.6** Add Jest tests for block components

- [x] **3.7** Commit Phase 3
  - Message: "feat: add custom Gutenberg blocks — watch showcase, collection grid, and contact form"

**Verification:**
- `npm run build` succeeds
- Blocks appear in Gutenberg block inserter
- Each block renders correctly in editor and on frontend
- `npm test` passes

---

## Phase 4: WOOCOMMERCE BACKEND + REAL PAYMENTS

> **Goal:** Real Stripe integration (test mode), webhook handlers, custom checkout fields.

- [x] **4.1** Set up Stripe test mode
  - Install Stripe PHP SDK via Composer in chronos-bridge
  - Create Stripe test account, get test API keys
  - Add keys to WordPress settings (encrypted in options table, NOT hardcoded)

- [x] **4.2** Create payment processing
  - Stripe Checkout Session creation endpoint
  - Webhook handler for `payment_intent.succeeded`, `checkout.session.completed`
  - Webhook signature verification

- [x] **4.3** Custom WooCommerce checkout fields
  - Add "Gift wrapping" checkbox
  - Add "Delivery instructions" textarea
  - Save to order meta, display in admin

- [x] **4.4** Replace frontend fake checkout with real Stripe
  - `src/pages/Checkout.tsx` — use Stripe.js / @stripe/react-stripe-js
  - Real payment flow: cart → Stripe Checkout → success/failure page

- [x] **4.5** PayPal integration (WooCommerce PayPal Payments plugin config)

- [x] **4.6** Commit Phase 4
  - Message: "feat: add real Stripe payment integration with webhooks and custom checkout fields"

**Verification:**
- Stripe test payment completes end-to-end (use card 4242 4242 4242 4242)
- Webhook fires and order status updates
- Custom checkout fields appear and save to order

---

## Phase 5: CI/CD PIPELINE + DEVOPS

> **Goal:** GitHub Actions auto-deploy, complete Docker setup, documentation.

- [x] **5.1** Create GitHub Actions workflow
  - File: `.github/workflows/ci.yml`
  - On push to main: run PHPCS, PHPUnit, Jest, npm build
  - On push to main (after tests pass): deploy to cPanel via cPanel API or SSH

- [x] **5.2** Auto-deploy script
  - Deploy only `wordpress/wp-content/plugins/chronos-bridge/` and `wordpress/wp-content/plugins/chronos-blocks/` to server
  - Use cPanel Git or API file upload (FTP blocked on AridHost)

- [x] **5.3** Complete Docker setup
  - Ensure `docker-compose up -d` gives working environment from scratch
  - Add WP-CLI auto-install script for plugins
  - Add sample data import script

- [x] **5.4** Add `.htaccess` sample config
  - Security headers, caching rules, rewrite rules
  - File: `wordpress/.htaccess.sample`

- [x] **5.5** Write comprehensive README.md for WordPress backend
  - File: `wordpress/README.md`
  - Setup instructions, architecture diagram, API docs

- [x] **5.6** Commit Phase 5
  - Message: "feat: add CI/CD pipeline with GitHub Actions, auto-deploy, and documentation"

**Verification:**
- Push to GitHub → Actions run → all checks green
- Deploy reaches cPanel server
- Fresh `docker-compose up` gives working site

---

## Phase 6: PERFORMANCE + SEO + ANALYTICS

> **Goal:** Core Web Vitals, structured data, Google Analytics, server-side caching.

- [ ] **6.1** Add Transients API caching to all expensive queries in chronos-bridge
- [ ] **6.2** Add object caching support (Redis-ready via WP_OBJECT_CACHE)
- [ ] **6.3** Add JSON-LD structured data for products (Product schema, Organization schema)
- [ ] **6.4** Add Google Analytics / GTM integration via plugin settings
- [ ] **6.5** Frontend performance: lazy loading, code splitting, image optimization
- [ ] **6.6** Add prerendering/SSR solution for React SPA (or meta tags via react-helmet)
- [ ] **6.7** Commit Phase 6
  - Message: "feat: add performance optimization, SEO structured data, and analytics integration"

**Verification:**
- Lighthouse score 90+ on performance
- Google Rich Results Test validates structured data
- Analytics tracking fires on page views

---

## Phase 7: WORDPRESS 7.0 AI INTEGRATION

> **Goal:** Build a feature using WP 7.0 AI Client API (released April 9, 2026).
> **Reference:** https://make.wordpress.org/core/2026/03/24/introducing-the-ai-client-in-wordpress-7-0/

- [ ] **7.1** Research WP 7.0 AI Client API (released April 9, 2026)
  - Read official docs, understand Connectors API and AI-powered abilities
  - Determine which AI provider to use (OpenAI or Anthropic)

- [ ] **7.2** Build AI-powered feature in chronos-bridge
  - Example: AI product description generator for watch listings
  - Register as AI-powered ability
  - Admin UI: "Generate Description" button on watch edit screen
  - Uses WP 7.0 AI Client → sends watch specs → returns marketing copy

- [ ] **7.3** Add AI-powered contact form auto-responder
  - Analyze incoming contact message sentiment/intent
  - Suggest admin reply based on context

- [ ] **7.4** Commit Phase 7
  - Message: "feat: add WordPress 7.0 AI integration — auto-generate watch descriptions and smart contact replies"

**Verification:**
- "Generate Description" button appears on watch edit screen
- Clicking it produces a relevant product description
- Contact form admin view shows AI-suggested replies

---

## Phase 8: ACCESSIBILITY + POLISH

> **Goal:** WCAG 2.1 AA compliance, GDPR, Git cleanup, final polish.

- [ ] **8.1** Audit and fix WCAG 2.1 AA issues
  - Semantic HTML, ARIA landmarks, keyboard navigation
  - Color contrast 4.5:1 minimum
  - Focus management on all interactive elements
  - Screen reader testing

- [ ] **8.2** Add GDPR/Privacy compliance
  - Register data exporter + eraser via WordPress Privacy API
  - Cookie consent banner on frontend
  - Privacy policy page content

- [ ] **8.3** Git workflow cleanup
  - Branch protection rules on main
  - Conventional commit messages going forward
  - PR template

- [ ] **8.4** Admin dashboard / customer portal improvements
  - Rich account page with order history, tracking, wishlists
  - Admin dashboard widget showing Chronos stats

- [ ] **8.5** Final commit + push
  - Message: "feat: add WCAG 2.1 AA accessibility, GDPR compliance, and admin dashboard"

**Verification:**
- axe DevTools reports 0 critical/serious issues
- WordPress Privacy > Export/Erase Personal Data works for plugin data
- Account page shows full order history

---

## PROGRESS TRACKER

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Security & credibility fixes | DONE (2026-04-07) |
| 2 | OOP PHP 8+ plugin rebuild | DONE (2026-04-07) |
| 3 | Gutenberg custom blocks | DONE (2026-04-08) |
| 4 | WooCommerce + real payments | DONE (2026-04-08) |
| 5 | CI/CD pipeline | DONE (2026-04-08) |
| 6 | Performance + SEO + Analytics | NOT STARTED |
| 7 | WordPress 7.0 AI integration | NOT STARTED |
| 8 | Accessibility + Polish | NOT STARTED |
