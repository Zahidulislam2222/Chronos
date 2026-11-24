# Chronos — working rules for people and AI agents

Headless WordPress/WooCommerce watch store with a React storefront and a small
AI guide service. Repository is **public**: treat every tracked file, Actions log
and artifact as world-readable. `CLAUDE.md` (private) has the same content as
this file; keep them identical.

## Read first

1. Private, ignored: `memory/MEMORY.md` (index and latest checkpoint),
   `TASKS.md` (status of every task), `PROJECT-DOSSIER.md` §2 requirements and
   §3 architecture, `BUILD_PLAN.md` (scope and exit criteria).
2. Public: [README](README.md), [architecture](docs/ARCHITECTURE.md),
   [configuration](docs/CONFIGURATION.md), [testing](docs/TESTING.md),
   [deployment](docs/DEPLOYMENT.md), [operations](docs/OPERATIONS.md),
   [design guide](DESIGN.md).
Documents orient; verify behaviour against source and tests before acting.

## Layout

| Path | What |
|---|---|
| `src/` | React 19 + TypeScript + Vite storefront; copy in `src/content/*.json` |
| `config/` | Validated runtime settings (assistant, catalogue, operations, build) |
| `scripts/` | Build, pre-render, release checks, availability probe, guide service |
| `verification/` | Node test suites (assistant, render, metadata, dependency security) |
| `wordpress/wp-content/plugins/chronos-bridge/` | Custom PHP 8.1+ plugin (REST, GraphQL, Stripe, privacy, health); settings owner `src/Configuration/Policy.php` |
| `wordpress/wp-content/plugins/chronos-blocks/` | Gutenberg blocks (`@wordpress/scripts`) |
| `deploy/` | VPS frontend, guide and backup scripts/templates (no secrets) |

## Commands

```bash
npm ci && npm run typecheck && npx eslint .          # frontend types and lint
npm run test:assistant && npm run test:render        # Node suites
npm run test:dependency-security                     # parser regression guard
npm audit --audit-level=moderate                     # must report 0
# PHP (local PHP lacks mbstring; CI uses 8.2, production runs 8.1):
docker run --rm -v "$PWD/wordpress/wp-content/plugins/chronos-bridge:/app" -w /app php:8.2-cli php vendor/bin/phpunit
docker run --rm -v "$PWD/wordpress/wp-content/plugins/chronos-bridge:/app" -w /app php:8.2-cli php vendor/bin/phpcs
cd wordpress/wp-content/plugins/chronos-blocks && npm ci && npm test && npm run lint:js && npm run build
```

`npm run build` writes to `dist/`. Root `dist/` is a protected historical build:
build candidates in a separate `git worktree add --detach` and run multi-step
shell work with `set -euo pipefail`.

## Conventions

- Configuration has one owner (global Rule 12): copy in `src/content/`, runtime
  settings in `config/`, backend operator settings in `Policy.php` (WordPress
  options), secrets only in the private credentials store or server env files.
- Smallest change per branch; tests with every fix; no audit or scanner
  suppressions (Rule 14). Justified coding-standard exceptions carry a reason.
- New UI follows [DESIGN.md](DESIGN.md) tokens and states.
- Dependencies: add one only for a stated need with no existing equivalent;
  verify the registry package and pin through the lock file.
- Keep public API contracts (REST `chronos/v1`, GraphQL fields the storefront
  queries) compatible or versioned. The storefront treats any GraphQL error as a
  failed request.
- Every task ends Verified, Failed, Unverified, Deferred or Not applicable with
  evidence (Rule 15); fresh-context review before release.

## Protected — never

- Commit `CREDENTIALS.md`, `.env*` (except `.env.example`), `wp-config*.php`,
  database dumps, `wp-content/uploads/`, third-party plugins, `memory/`,
  `my-project-view/`, `tests/` (personal tooling) or `dist/`.
- Print credential values; read key names only.
- Stop the backend VM (its address is ephemeral), reload the shared PHP-FPM,
  reset or refund the assistant budget journal, replay a consumed promotion
  helper, or restart the paused local model.
- Deploy, spend money, push, rotate credentials or edit the Google Doc/PDF
  without the owner's explicit request (Rules 5, 6, 9).

## Releases (Rule 9)

Local first: snapshot and hash live files, reconcile drift, build from the
reviewed commit, stage a new immutable release, keep the previous one, promote,
exercise real flows, prove every-file hash parity. Backend classes load from an
immutable release directory selected by the plugin's `content/runtime.php`.
Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [deploy/backup](deploy/backup/README.md).
