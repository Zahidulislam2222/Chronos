import Media from "@/components/Media";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { fetchPostBySlug } from "@/utils/api";
import { content } from "@/content";
export default function BlogPost() {
  const { slug = "" } = useParams();
  const {
    data: p,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => fetchPostBySlug(slug),
  });
  return (
    <Layout>
      {!p ? (
        <div className="container section">
          <h1>
            {isPending
              ? content.ui.loading
              : isError
                ? content.ui.failure
                : content.ui.storyNotFound}
          </h1>
          {isError && (
            <button onClick={() => refetch()}>{content.ui.retry}</button>
          )}
          <Link to="/blog">{content.journal.cta}</Link>
        </div>
      ) : (
        <article className="article container">
          <Link to="/blog" className="back-link">
            ← {content.journal.cta}
          </Link>
          <p className="eyebrow">
            {p.category} / {p.readTime}
          </p>
          <h1>{p.title}</h1>
          <p className="article-lead">{p.excerpt}</p>
          <div className="article-image">
            <Media src={p.featuredImage} alt="A study of a Chronos timepiece" />
          </div>
          <div className="article-body">
            {String(p.content)
              .split(/<\/p>/i)
              .map((part, i) => {
                const text = part.replace(/<[^>]*>/g, " ").trim();
                return text ? <p key={i}>{text}</p> : null;
              })}
            <p className="eyebrow">{p.author.name}</p>
          </div>
        </article>
      )}
    </Layout>
  );
}
