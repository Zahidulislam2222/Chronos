import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { fetchPostBySlug, fetchPosts, createComment } from '@/utils/api';
import { BlogPost as BlogPostType } from '@/lib/mockData';
import { parseWPContent } from '@/lib/parseWPContent';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, ArrowLeft, ArrowRight, MessageSquare, Send } from 'lucide-react';

interface ExtendedBlogPost extends BlogPostType {
  databaseId: number;
  comments: Array<{
    id: string;
    content: string;
    date: string;
    author: { node: { name: string; avatar?: { url: string } } };
  }>;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, openLoginModal } = useAuth(); // <--- We use 'user' to check login status
  
  const [post, setPost] = useState<ExtendedBlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  // <--- CHANGED: Only store content in local state if user is logged in
  const [commentForm, setCommentForm] = useState({ author: '', email: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const currentPost = await fetchPostBySlug(slug);
        setPost(currentPost);
        const postsList = await fetchPosts();
        setAllPosts(postsList);
      } catch (error) {
        console.error("Error loading article:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    
    if (!user) {
      openLoginModal();
      return;
    }
    
    setIsSubmitting(true);
    try {
      // <--- NEW: If user is logged in, use their Auth data automatically
      const authorName = user.name || commentForm.author;
      const authorEmail = user.email || commentForm.email;

      const result = await createComment(
        post.databaseId, 
        authorName, // <--- Use context data
        authorEmail, // <--- Use context data
        commentForm.content
      );
      
      if (result.success) {
        setSubmitStatus('success');
        setCommentForm({ author: '', email: '', content: '' }); 
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = postIndex > 0 ? allPosts[postIndex - 1] : null;
  const nextPost = (postIndex !== -1 && postIndex < allPosts.length - 1) ? allPosts[postIndex + 1] : null;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <p className="text-gold font-serif animate-pulse text-xl">Loading Article...</p>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="font-serif text-4xl mb-4">Article Not Found</h1>
            <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black" asChild>
              <Link to="/journal">Return to Journal</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative h-[60vh] min-h-[400px]">
        <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </section>

      <section className="py-16 bg-black text-white -mt-32 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* ... (Header content unchanged) ... */}
            <Link to="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-gold transition-colors mb-8">
              <ChevronLeft className="w-4 h-4" /> Back to Journal
            </Link>
            <span className="inline-block px-3 py-1 bg-gold/10 text-gold text-sm font-medium tracking-wider uppercase rounded mb-6">{post.category}</span>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6">{post.title}</h1>
            <div className="flex items-center gap-6 text-gray-400 mb-12">
              <div className="flex items-center gap-3">
                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
                <span>{post.author.name}</span>
              </div>
              <span>·</span><span>{post.date}</span><span>·</span>
              <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readTime}</div>
            </div>

            <div className="prose prose-invert prose-lg max-w-none text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: parseWPContent(post.content) }} />
            </div>

            <div className="mt-16 p-8 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center gap-4">
                <img src={post.author.avatar} alt={post.author.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <p className="font-serif text-lg text-white">{post.author.name}</p>
                  <p className="text-gray-400 text-sm">Contributing Writer</p>
                </div>
              </div>
            </div>

            {/* --- COMMENT SECTION --- */}
            <div className="mt-20 pt-12 border-t border-gray-800">
              <h3 className="text-2xl font-serif mb-8 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gold" />
                Discussion ({post.comments?.length || 0})
              </h3>

              {/* Existing Comments (Unchanged) */}
              <div className="space-y-8 mb-12">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-900/50 p-6 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gold font-bold">
                             {comment.author.node.name.charAt(0)}
                          </div>
                          <span className="font-medium text-white">{comment.author.node.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.content }} />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts.</p>
                )}
              </div>

              {/* --- UPDATED COMMENT FORM --- */}
              <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
                <h4 className="text-xl font-serif mb-6 text-white">Leave a Reply</h4>
                
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Please log in to leave a comment.</p>
                    <Button variant="gold" onClick={openLoginModal}>
                      Sign In
                    </Button>
                  </div>
                ) : submitStatus === 'success' ? (
                  <div className="bg-green-900/20 border border-green-800 text-green-400 p-4 rounded text-center">
                    Thank you! Your comment has been submitted and is awaiting approval.
                  </div>
                ) : (
                  <form onSubmit={handleCommentSubmit} className="space-y-6">
                    {/* 
                       <--- CHANGED: Logic to hide/show Name & Email 
                       If User is logged in, we HIDE these fields completely.
                    */}
                    {!user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-gray-500">Name</label>
                          <input 
                            type="text" 
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-gold outline-none transition-colors"
                            value={commentForm.author}
                            onChange={(e) => setCommentForm({...commentForm, author: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-gray-500">Email</label>
                          <input 
                            type="email" 
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-gold outline-none transition-colors"
                            value={commentForm.email}
                            onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* <--- NEW: Show who they are posting as */}
                    {user && (
                      <div className="flex items-center gap-3 mb-2 p-3 bg-black/50 rounded border border-gray-800">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-gold text-xs font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Commenting as </span>
                          <span className="text-white font-medium">{user.name}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-gray-500">Comment</label>
                      <textarea 
                        required
                        rows={4}
                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-gold outline-none transition-colors"
                        value={commentForm.content}
                        onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-gold text-black font-bold uppercase tracking-wider px-8 py-3 hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? 'Sending...' : 'Post Comment'}
                      {!isSubmitting && <Send className="w-4 h-4" />}
                    </button>
                    
                    {submitStatus === 'error' && (
                      <p className="text-red-400 text-sm mt-2">Failed to post comment. Please try again.</p>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Navigation (Unchanged) */}
            <div className="mt-16 pt-8 border-t border-gray-800 grid grid-cols-2 gap-8">
              {prevPost ? (
                <Link to={`/blog/${prevPost.slug}`} className="group">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />Previous
                  </div>
                  <p className="font-serif text-white group-hover:text-gold transition-colors line-clamp-2">{prevPost.title}</p>
                </Link>
              ) : <div />}
              {nextPost && (
                <Link to={`/blog/${nextPost.slug}`} className="group text-right">
                  <div className="flex items-center justify-end gap-2 text-gray-500 text-sm mb-2">
                    Next<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="font-serif text-white group-hover:text-gold transition-colors line-clamp-2">{nextPost.title}</p>
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