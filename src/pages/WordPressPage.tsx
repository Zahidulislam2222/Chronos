import { useLocation, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import WordPressContent from "@/components/WordPressContent";
import NotFound from "./NotFound";
import { fetchPage } from "@/utils/wordpressApi";
import { wordpressLink } from "@/lib/wordpress";
import { content } from "@/content";

export default function WordPressPage() {
  const {pathname} = useLocation();
  const result = useQuery({queryKey:["wordpress-page",pathname],queryFn:()=>fetchPage(pathname)});
  if (result.isPending) return <Layout><div className="container section"><h1>{content.ui.loading}</h1></div></Layout>;
  if (result.isError) return <Layout><div className="container section"><h1>{content.ui.failure}</h1><button onClick={()=>result.refetch()}>{content.ui.retry}</button></div></Layout>;
  if (!result.data) return <NotFound />;
  const canonical = wordpressLink(result.data.url).replace(/\/$/, "");
  if (canonical !== pathname.replace(/\/$/, "") && canonical.startsWith("/")) return <Navigate to={canonical} replace />;
  return <Layout><article className="article container"><h1>{result.data.title}</h1><WordPressContent html={result.data.content} /></article></Layout>;
}
