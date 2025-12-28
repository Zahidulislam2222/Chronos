import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { fetchPosts } from '@/utils/api'; // Import the API connector
import { BlogPost } from '@/lib/mockData'; // Import the type

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real posts when the page loads
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load blog posts", error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  return (
    <Layout>
      {/* Hero Section (Unchanged) */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-primary tracking-[0.3em] uppercase text-sm mb-4 block">
              The Journal
            </span>
            <h1 className="font-display text-5xl md:text-6xl mb-6">
              Stories & Insights
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the world of haute horlogerie through our curated articles on craftsmanship, history, and collecting.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Grid (Updated to use Real Data) */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          {loading ? (
            // Simple Loading State
            <div className="text-center py-20 text-gold">Loading Journal...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))
              ) : (
                <div className="text-center col-span-3">No articles found.</div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;