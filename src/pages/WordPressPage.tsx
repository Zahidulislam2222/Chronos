import { useLocation, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import WordPressContent from "@/components/WordPressContent";
import NotFound from "./NotFound";
import { fetchPage } from "@/utils/wordpressApi";
import { wordpressLink } from "@/lib/wordpress";
import { content } from "@/content";
import { navigationSettings } from "@/config/navigation";
import { assistantContent } from "@/config/assistant";

export default function WordPressPage() {
  const {pathname} = useLocation();
  const result = useQuery({queryKey:["wordpress-page",pathname],queryFn:()=>fetchPage(pathname)});
  if (result.isPending) return <Layout><div className="container section"><h1>{content.ui.loading}</h1></div></Layout>;
  if (result.isError) return <Layout><div className="container section"><h1>{content.ui.failure}</h1><button onClick={()=>result.refetch()}>{content.ui.retry}</button></div></Layout>;
  if (!result.data) return <NotFound />;
  const canonical = wordpressLink(result.data.url).replace(/\/$/, "");
  if (canonical !== pathname.replace(/\/$/, "") && canonical.startsWith("/")) return <Navigate to={canonical} replace />;
  return <Layout>
    <article className="container information-page">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">{navigationSettings.pages.homeLabel}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{result.data.title}</span>
      </nav>
      <div className="information-grid">
        <header className="information-heading">
          <p className="eyebrow">{navigationSettings.pages.eyebrow}</p>
          <h1>{result.data.title}</h1>
          <Link className="text-link" to={navigationSettings.pages.collectionHref}>{navigationSettings.pages.collectionLabel}</Link>
        </header>
        <WordPressContent html={result.data.content} />
      </div>
      {pathname.replace(/\/$/, "") === "/privacy" && <aside>
        <h2>{assistantContent.privacyPolicyTitle}</h2><p>{assistantContent.privacyPolicy}</p>
      </aside>}
    </article>
  </Layout>;
}
