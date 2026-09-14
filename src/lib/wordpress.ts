import DOMPurify from "dompurify";
import { settings } from "@/config/settings";

/** Preserve media paths when older WordPress records retain a retired origin. */
export function wordpressMedia(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value, settings.wpApiUrl || window.location.origin);
    if (url.pathname.startsWith("/wp-content/uploads/") && settings.wpApiUrl)
      return new URL(url.pathname + url.search, settings.wpApiUrl).href;
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function wordpressLink(value: string): string {
  try {
    const url = new URL(value, settings.wpApiUrl || window.location.origin);
    if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return "";
    if (settings.wpApiUrl && url.origin === new URL(settings.wpApiUrl).origin) {
      if (url.pathname === "/my-account/") return "/account";
      if (!url.pathname.startsWith("/wp-")) return url.pathname + url.search + url.hash;
    }
    if (settings.siteUrl && url.origin === new URL(settings.siteUrl).origin)
      return url.pathname + url.search + url.hash;
    return url.href;
  } catch { return ""; }
}

export function wordpressHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ["form", "input", "button", "textarea", "select", "style"] });
  const template = document.createElement("template");
  template.innerHTML = clean;
  template.content.querySelectorAll("a[href]").forEach(a => {
    a.setAttribute("href", wordpressLink(a.getAttribute("href") || ""));
    a.setAttribute("rel", "noopener noreferrer");
  });
  template.content.querySelectorAll("img").forEach(img => {
    img.setAttribute("src", wordpressMedia(img.getAttribute("src") || ""));
    img.removeAttribute("srcset");
    img.setAttribute("loading", "lazy");
  });
  return DOMPurify.sanitize(template.innerHTML, { USE_PROFILES: { html: true } });
}

export function wordpressText(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return template.content.textContent || "";
}
