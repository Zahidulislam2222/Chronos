import { z } from "zod";
import raw from "@/content/search.json";
import { previewCatalogue, content } from "@/content";
import { settings } from "@/config/settings";

export const searchContent = z.object({
  image: z.string().startsWith("/images/"), imageAlt: z.string().min(1),
  siteDescription: z.string().min(1),
  creator: z.object({ name: z.string().min(1), url: z.string().url() }),
  routes: z.array(z.object({ path: z.string().startsWith("/"), title: z.string().min(1), description: z.string().min(1), index: z.boolean() })),
  productSuffix: z.string(), productDisclosure: z.string(),
  notFound: z.object({ title: z.string(), description: z.string() }),
}).parse(raw);

export function pageSearch(pathname: string) {
  const path = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
  const product = previewCatalogue.products.find(p => path === `/product/${p.slug}`);
  const post = previewCatalogue.posts.find(p => path === `/blog/${p.slug}`);
  const entry = searchContent.routes.find(p => p.path === path);
  const title = product ? `${product.name} — ${searchContent.productSuffix}` : post ? post.title : entry?.title || searchContent.notFound.title;
  const description = product ? `${product.shortDescription} ${searchContent.productDisclosure}` : post ? post.excerpt : entry?.description || searchContent.notFound.description;
  const canonical = settings.siteUrl ? new URL(path, settings.siteUrl).href : "";
  const image = settings.siteUrl ? new URL(product?.image || post?.featuredImage || searchContent.image, settings.siteUrl).href : "";
  const index = Boolean(settings.searchIndexable && (entry?.index || product || post));
  const websiteId = `${settings.siteUrl.replace(/\/$/, "")}/#website`;
  const page = {
    "@type": post ? "Article" : product ? "CreativeWork" : "WebPage",
    "@id": canonical + "#content", url: canonical, name: title,
    ...(post ? { headline: title, author: { "@type": "Organization", name: post.author.name } } : {}),
    description, image, inLanguage: "en", isPartOf: { "@id": websiteId },
    ...(product ? { creator: { "@type": "Person", ...searchContent.creator } } : {}),
  };
  // Fictional concepts are CreativeWork, never merchant offers or review ratings.
  const graph: Record<string, unknown>[] = [
    { "@type": "WebSite", "@id": websiteId, url: settings.siteUrl, name: content.brand.name, description: searchContent.siteDescription, creator: { "@type": "Person", ...searchContent.creator }, inLanguage: "en" },
    page,
  ];
  if (path !== "/" && index) graph.push({ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: content.brand.name, item: settings.siteUrl.replace(/\/$/, "") + "/" },
    { "@type": "ListItem", position: 2, name: title, item: canonical },
  ] });
  return { title: `${title} | ${content.brand.name}`, description, canonical, image, index, type: post ? "article" : "website", jsonLd: { "@context": "https://schema.org", "@graph": graph } };
}
