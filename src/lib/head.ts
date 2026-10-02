// React 19 hoists SEOHead's tags into <head> itself and never adopts the
// static shell title or the prerendered copies. Capture those before React
// inserts its own (this module loads before SEOHead can render) and drop them
// once SEOHead's first commit has put the replacements in place, so the
// document is never without a title and never paints duplicates.
const staleHeadNodes = typeof document === "undefined"
  ? []
  : Array.from(document.head.querySelectorAll("[data-chronos-head]"));

export function removeStaleHeadNodes() {
  staleHeadNodes.splice(0).forEach((node) => node.remove());
}
