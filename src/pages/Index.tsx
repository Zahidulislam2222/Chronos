import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import ValueProposition from "@/components/ValueProposition";
import BlogPreview from "@/components/BlogPreview";
import Newsletter from "@/components/Newsletter";
import { fetchProducts, fetchPosts } from "@/utils/api";
import { content } from "@/content";
export default function Index() {
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const posts = useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
  return (
    <Layout>
      <Hero />
      {products.isError ? (
        <div className="container section" role="alert">
          {content.ui.failure}
          <button onClick={() => products.refetch()}>{content.ui.retry}</button>
        </div>
      ) : (
        <FeaturedProducts products={products.data ?? []} />
      )}
      <ValueProposition />
      <BlogPreview posts={posts.data ?? []} />
      <Newsletter />
    </Layout>
  );
}
