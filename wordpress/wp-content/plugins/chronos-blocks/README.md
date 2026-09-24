# Chronos Blocks

Version 1.0.0 · GPL-2.0-or-later · PHP 8.1+

Custom Gutenberg blocks for Chronos, built with `@wordpress/scripts`. Each
block is server-rendered (`render.php`), so the output stays correct when
watch data changes.

| Block | Name | What it does |
|---|---|---|
| Watch Showcase | `chronos/watch-showcase` | Featured watch with image, price and call to action |
| Watch Collection Grid | `chronos/watch-collection-grid` | Grid of `chronos_watch` posts; options for columns, items per page, brand, movement, sort order and price display |
| Contact Form | `chronos/contact-form` | Form that posts to the `chronos/v1/contact` REST endpoint (rate-limited by `chronos-bridge`) |

The blocks read data registered by
[`chronos-bridge`](../chronos-bridge/README.md), so activate that plugin first.

## Install

The compiled `build/` folder is committed, so the plugin works after
activation (`wp plugin activate chronos-blocks`). Rebuild only if you
change `src/`.

## Development

```bash
cd wordpress/wp-content/plugins/chronos-blocks
npm ci
npm start          # watch mode
npm run build      # production build into build/
npm run lint:js    # ESLint + Prettier (@wordpress/scripts)
npm test           # Jest: 19 tests
npm run format
```

CI runs lint, build and Jest on pushes to `main` and every pull request;
the Security workflow runs `npm audit`.
On Windows, CRLF checkouts make Prettier report every line; see
[CONTRIBUTING.md](../../../../CONTRIBUTING.md#run-the-same-checks-as-ci).

## Structure

```
src/<block>/
├── block.json     block metadata and attributes
├── index.js       registration
├── edit.js        editor UI
├── render.php     server-side output
├── style.scss     front-end styles
└── editor.scss    editor-only styles
tests/             Jest tests
build/             compiled assets (committed)
```

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
