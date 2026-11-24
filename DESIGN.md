# Design guide

How to build Chronos UI without inventing new styles. Values live in one
place each; this guide explains how to use them and never repeats them.

## Where the values live

| What | Owner | Use it through |
|---|---|---|
| Colour, radius and font tokens | `:root` custom properties in [`src/index.css`](src/index.css) | Tailwind names in [`tailwind.config.ts`](tailwind.config.ts) (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-accent`, `font-display`, `font-body`) or the named brand variables (`--ink`, `--paper`, `--forest`, `--brass`, `--line`) inside component CSS |
| Layout primitives | `.container`, `.section` in `src/index.css` | Wrap every page section in `<section className="container section">` |
| Type roles | `.eyebrow` (small caps label), headings in `font-display`, body in `font-body` | Reuse the role classes; do not set ad-hoc font sizes |
| Buttons and links | `.button`, `.button-light`, `.button-dark`, `.text-link` | Pick the variant by background; one primary action per view |
| Cinematic scroll film | [`src/cinema.css`](src/cinema.css), `ScrollFilm.tsx`, `config/` cinema settings | Change frames and timing in configuration, not in components |
| Primitive widgets | [`src/components/ui/`](src/components/ui) (Radix-based) | Compose these before writing a new widget |
| Visitor-facing words | `src/content/*.json` (validated by Zod in `src/content/index.ts`) | Never hard-code copy in components |

The radius token is deliberately zero: Chronos uses square edges. Keep it.

## Breakpoints

Component CSS uses the existing media queries in `src/index.css` (narrow phones,
the 760 px tablet break, the 1100 px desktop break and the wide 1600 px layout).
Add a rule to the matching existing query instead of introducing a new width.

## States every interactive component needs

| State | Rule |
|---|---|
| Focus | The shared `:focus-visible` outline in `src/index.css` must stay visible; never remove outlines without an equal replacement |
| Hover | Colour or underline change only; never the only signal of an action |
| Disabled / pending | Keep layout stable; show a text status (for example "Please wait…") from content JSON |
| Loading | Use the existing skeleton or text placeholders; no spinner-only states |
| Empty | Explain what is missing and offer the next action (see `content.ui.noResults`) |
| Error | Plain-language message from content JSON plus a retry or alternative route; never fake success |
| Reduced motion | `prefers-reduced-motion` blocks in both stylesheets replace motion with static frames; new animation must join them |

## Accessibility baseline

Meet WCAG 2.2 AA: text contrast from the existing token pairs (foreground on
background, primary-foreground on primary), visible focus, labelled controls,
keyboard reachability for every action, and alternative text that describes the
image. The automated axe and three-engine browser suites in `verification/`
must report no serious or critical issue before release.

## Adding something new

1. Look for an existing token, class or `ui/` component that fits.
2. If none fits, add the token once to `src/index.css` (and its Tailwind name if
   it is used from markup), then describe its role here.
3. Put copy in `src/content/`, behaviour settings in `config/`.
4. Run the render and accessibility suites (see [docs/TESTING.md](docs/TESTING.md)).
