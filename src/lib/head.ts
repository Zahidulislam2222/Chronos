// React 19 hoists SEOHead's <title>, <meta> and <link> tags into <head> itself
// (the inline JSON-LD script stays in the body) and, as of react-dom 19.3,
// never adopts the static shell title or the prerendered copies on a client
// mount. Capture those before React inserts its own (this module loads before
// SEOHead can render) and drop them once SEOHead's first commit has put the
// replacements in place, so the document is never without a title and never
// paints duplicates. If a later React adopted existing nodes, this would remove
// React's own title; prerender.mjs fails the build on any title count but one.
const staleHeadNodes = typeof document === "undefined"
  ? []
  : Array.from(document.head.querySelectorAll("[data-chronos-head]"));

export function removeStaleHeadNodes() {
  staleHeadNodes.splice(0).forEach((node) => node.remove());
}
