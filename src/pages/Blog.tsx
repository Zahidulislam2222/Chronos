import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { mockBlogPosts } from '@/lib/mockData';

const Blog = () => {
  return (
    <Layout>
      {/* Hero */}
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

      {/* Blog Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockBlogPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} index={index} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
