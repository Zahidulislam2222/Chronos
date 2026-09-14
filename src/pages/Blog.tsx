import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import BlogCard from "@/components/BlogCard";
import { fetchPosts } from "@/utils/api";
import { content } from "@/content";
export default function Blog() {
  const {
    data = [],
    isPending,
    isError,
    refetch,
  } = useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
  return (
    <Layout>
      <div className="container page-intro">
        <p className="eyebrow">{content.journal.eyebrow}</p>
        <h1>{content.journal.title}</h1>
        <p>{content.brand.tagline}</p>
      </div>
      <section className="container section pt-0">
        {isPending ? (
          <p role="status">{content.ui.loading}</p>
        ) : isError ? (
          <div role="alert">
            {content.ui.failure}
            <button onClick={() => refetch()}>{content.ui.retry}</button>
          </div>
        ) : (
          <div className="journal-grid">
            {data.map((p, i) => (
              <BlogCard key={p.id} post={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
