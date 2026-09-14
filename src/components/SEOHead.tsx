import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { content } from "@/content";
import { pageSearch, searchContent } from "@/lib/search";
import { useQuery } from "@tanstack/react-query";
import { fetchProductBySlug, fetchPostBySlug } from "@/utils/api";
import { fetchPage } from "@/utils/wordpressApi";
import { isPreview } from "@/config/settings";
import { wordpressText } from "@/lib/wordpress";

export default function SEOHead() {
  const { pathname } = useLocation();
  const productSlug = pathname.startsWith("/product/") ? pathname.slice("/product/".length) : "";
  const postSlug = pathname.startsWith("/blog/") ? pathname.slice("/blog/".length) : "";
  const product = useQuery({queryKey:["product",productSlug],queryFn:()=>fetchProductBySlug(productSlug),enabled:!isPreview&&Boolean(productSlug)});
  const post = useQuery({queryKey:["post",postSlug],queryFn:()=>fetchPostBySlug(postSlug),enabled:!isPreview&&Boolean(postSlug)});
  const cms = useQuery({queryKey:["wordpress-page",pathname],queryFn:()=>fetchPage(pathname),enabled:!isPreview&&!productSlug&&!postSlug&&!["/","/shop","/blog","/cart","/checkout","/checkout/success","/account","/my-account","/contact"].includes(pathname)});
  const remote = product.data ? {title:product.data.name,description:product.data.shortDescription,image:product.data.image,kind:"Product"} : post.data ? {title:post.data.title,description:post.data.excerpt,image:post.data.featuredImage,kind:"Article"} : cms.data ? {title:cms.data.title,description:wordpressText(cms.data.content).slice(0,160),kind:"WebPage"} : undefined;
  const page = pageSearch(pathname,remote);
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
