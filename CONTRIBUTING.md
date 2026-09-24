# Contributing to Chronos

Thanks for your interest. Chronos is a portfolio project maintained by one
person, so reviews can take a few days. Bug reports, documentation fixes and
focused pull requests are welcome.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
Security problems go through [SECURITY.md](SECURITY.md), never public issues.

## Ground rules

1. **One change per pull request.** Keep the diff small and focused.
2. **Tests and gates must pass.** CI runs automatically on every PR and
   needs no secrets.
3. **No secrets, ever.** No keys, tokens, passwords, database dumps,
   `wp-config.php` or `.env` files. Use fake values like `test-key` in tests.
4. **No hardcoded configuration.** URLs, limits, model IDs and copy belong in
   `src/config/`, `config/*.json`, `src/content/*.json`, WordPress options or
   environment variables, not in feature code.
5. **Don't commit third-party WordPress plugins, uploads or build output**
   (see `.gitignore`).
6. **Be honest in docs.** Don't claim capacity, uptime or compliance that has
   not been measured. Label targets as targets.

## Local setup

Requirements: Docker, Node.js ≥ 22.12, and PHP 8.1+ with Composer (or use the
Docker container).

```bash
git clone https://github.com/Zahidulislam2222/Chronos.git
cd Chronos

# Backend (WordPress on http://localhost:8888):
# follow the Quick start in wordpress/README.md (Composer, docker-compose,
# setup.sh, GraphQL add-ons, sample data, blocks build)

# Frontend (http://localhost:8080)
cp .env.example .env.local   # point VITE_API_URL at http://localhost:8888/graphql
npm ci
npm run dev
```

Preview mode (`VITE_STOREFRONT_MODE=preview`) needs no backend at all.

## Run the same checks as CI

```bash
# Frontend
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run lint
npx playwright install chromium
npm run build && npm run verify:release

# Gutenberg blocks
cd wordpress/wp-content/plugins/chronos-blocks
npm ci && npm audit --audit-level=moderate
npm run lint:js && npm run build && npm test

# PHP plugin
cd ../chronos-bridge
composer install
vendor/bin/phpcs --standard=phpcs.xml --warning-severity=0
vendor/bin/phpunit
composer audit
```

**Windows:** Git may check files out with CRLF line endings, and Prettier
(blocks lint) and PHPCS will then report every line. CI runs on Linux with LF.
Use `git config core.autocrlf input`, or run the checks in WSL or Docker.

## Coding standards

| Area | Standard |
|---|---|
| PHP | WordPress Coding Standards (PHPCS, `phpcs.xml`), PHP 8.1+, strict types where possible, `permission_callback` on every REST route, `$wpdb->prepare` for every query, sanitise input and escape output |
| Blocks | `@wordpress/scripts` ESLint + Prettier |
| Frontend | TypeScript strict mode, ESLint, Zod validation at config and API boundaries; render CMS HTML only through the existing DOMPurify helpers |

## Commits and pull requests

- Use clear commit messages, for example `fix(checkout): reject expired session IDs`.
- Fill in the PR template: what changed, why, and how you tested it.
- Add or update tests with behaviour changes.
- Update the docs (`README.md`, `docs/`) and [CHANGELOG.md](CHANGELOG.md)
  when behaviour, configuration or APIs change.

## Reporting bugs and ideas

Use the issue templates. Include steps to reproduce, expected vs actual
behaviour, and the environment (browser, Node/PHP version, local or public
demo).

## License of contributions

Contributions to the frontend and root files are licensed MIT. Contributions
to `chronos-bridge` and `chronos-blocks` are licensed GPL-2.0-or-later. See
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
