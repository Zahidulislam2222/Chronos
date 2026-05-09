import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import ValueProposition from '@/components/ValueProposition';
import BlogPreview from '@/components/BlogPreview';
import Newsletter from '@/components/Newsletter';
import { fetchProducts, fetchPosts } from '@/utils/api';
import { Product, BlogPost } from '@/lib/mockData';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
    fetchPosts().then(setPosts).catch(console.error);
  }, []);

  return (
    <Layout>
      <SEOHead
        description="Luxury watches curated for the discerning collector. Explore Rolex, Omega, Patek Philippe and more."
      />
      <Hero />
      <ValueProposition />
      <FeaturedProducts products={products} />
      <BlogPreview posts={posts} />
      <Newsletter />
    </Layout>
  );
};

export default Index;
