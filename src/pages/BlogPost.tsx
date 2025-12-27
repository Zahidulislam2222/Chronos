import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { mockBlogPosts } from '@/lib/mockData';
import { formatDate, parseWPContent } from '@/lib/parseWPContent';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();
  
  const postIndex = mockBlogPosts.findIndex((p) => p.slug === slug);
  const post = mockBlogPosts[postIndex];
  const prevPost = postIndex > 0 ? mockBlogPosts[postIndex - 1] : null;
  const nextPost = postIndex < mockBlogPosts.length - 1 ? mockBlogPosts[postIndex + 1] : null;

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl mb-4">Article Not Found</h1>
            <Button variant="luxuryOutline" asChild>
              <Link to="/blog">Return to Journal</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px]">
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </section>

      {/* Content */}
      <section className="py-16 bg-background -mt-32 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Journal
            </Link>

            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium tracking-wider uppercase rounded mb-6">
              {post.category}
            </span>

            <h1 className="font-display text-4xl md:text-5xl leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex items-center gap-6 text-muted-foreground mb-12">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span>{post.author.name}</span>
              </div>
              <span>·</span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                {post.excerpt}
              </p>

              <div
                dangerouslySetInnerHTML={{ __html: parseWPContent(post.content) }}
              />

              {/* Placeholder content for demo */}
              <p className="leading-relaxed">
                The world of haute horlogerie is one of extraordinary precision and artistry. 
                Each component, no matter how small, is crafted with an attention to detail 
                that borders on obsession. This dedication to perfection has been passed down 
                through generations of watchmakers, creating a tradition that continues to 
                evolve while honoring its roots.
              </p>

              <p className="leading-relaxed">
                From the intricate movements that power these mechanical marvels to the 
                exquisite finishing of cases and dials, every element represents countless 
                hours of human skill and ingenuity. It is this combination of technical 
                excellence and artistic expression that makes luxury watches more than 
                mere timekeeping instruments—they are wearable works of art.
              </p>
            </div>

            {/* Author Bio */}
            <div className="mt-16 p-8 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-display text-lg">{post.author.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Contributing Writer
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-16 pt-8 border-t border-border grid grid-cols-2 gap-8">
              {prevPost ? (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="group"
                >
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Previous
                  </div>
                  <p className="font-display group-hover:text-primary transition-colors line-clamp-2">
                    {prevPost.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
              
              {nextPost && (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="group text-right"
                >
                  <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm mb-2">
                    Next
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="font-display group-hover:text-primary transition-colors line-clamp-2">
                    {nextPost.title}
                  </p>
                </Link>
              )}
            </div>
          </motion.article>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPost;
