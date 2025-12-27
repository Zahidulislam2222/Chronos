import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import ValueProposition from '@/components/ValueProposition';
import BlogPreview from '@/components/BlogPreview';
import Newsletter from '@/components/Newsletter';
import { mockProducts, mockBlogPosts } from '@/lib/mockData';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <ValueProposition />
      <FeaturedProducts products={mockProducts} />
      <BlogPreview posts={mockBlogPosts} />
      <Newsletter />
    </Layout>
  );
};

export default Index;
