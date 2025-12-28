import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BlogPost } from '@/lib/mockData';
import BlogCard from './BlogCard';
import { Button } from '@/components/ui/button';
import { fetchPosts } from '@/utils/api'; // API Connection

const BlogPreview = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  // Fetch real posts automatically
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load blog preview", error);
      }
    };
    loadPosts();
  }, []);

  // If no posts yet, render nothing (or you could render a skeleton)
  if (posts.length === 0) return null;

  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
        >
          <div>
            <span className="text-primary tracking-[0.3em] uppercase text-sm mb-4 block">
              The Journal
            </span>
            <h2 className="font-display text-4xl md:text-5xl">
              Stories of Craft
            </h2>
          </div>
          <Button variant="luxuryOutline" asChild>
            <Link to="/blog">
              All Articles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Automatically slice the first 3 items from the API */}
          {posts.slice(0, 3).map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;