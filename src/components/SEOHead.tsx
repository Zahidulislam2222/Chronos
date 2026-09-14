import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { content } from "@/content";
import { pageSearch, searchContent } from "@/lib/search";

export default function SEOHead() {
  const { pathname } = useLocation();
  const page = pageSearch(pathname);
  return <Helmet>
    <title>{page.title}</title>
    <meta name="description" content={page.description} />
    <meta name="robots" content={page.index ? "index, follow, max-image-preview:large" : "noindex, follow"} />
    {page.canonical && <link rel="canonical" href={page.canonical} />}
    <meta property="og:title" content={page.title} />
    <meta property="og:description" content={page.description} />
    <meta property="og:type" content={page.type} />
    <meta property="og:url" content={page.canonical} />
    <meta property="og:site_name" content={content.brand.name} />
    <meta property="og:locale" content="en_US" />
    <meta property="og:image" content={page.image} />
    <meta property="og:image:alt" content={searchContent.imageAlt} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={page.title} />
    <meta name="twitter:description" content={page.description} />
    <meta name="twitter:image" content={page.image} />
    <meta name="twitter:image:alt" content={searchContent.imageAlt} />
    {page.index && <script type="application/ld+json">{JSON.stringify(page.jsonLd).replace(/</g, "\\u003c")}</script>}
  </Helmet>;
}
