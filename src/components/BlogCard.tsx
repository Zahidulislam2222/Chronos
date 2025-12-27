import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BlogPost } from '@/lib/mockData';
import { formatDate } from '@/lib/parseWPContent';
import { ArrowRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

const BlogCard = ({ post, index = 0 }: BlogCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-primary/20 backdrop-blur-sm text-primary text-xs font-medium tracking-wider uppercase rounded">
              {post.category}
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>

        <Link to={`/blog/${post.slug}`}>
          <h3 className="font-display text-xl leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-primary text-sm font-medium group/link"
        >
          Read Article
          <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
};

export default BlogCard;
