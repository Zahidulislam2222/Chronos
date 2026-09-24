import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { content } from "@/content";
import type { BlogPost } from "@/lib/mockData";
import BlogCard from "./BlogCard";
import Reveal from "./Reveal";
export default function BlogPreview({ posts }: { posts: BlogPost[] }) {
  const c = content.journal;
  return (
    <section className="section container journal-section">
      <Reveal className="section-heading">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2>{c.title}</h2>
        </div>
        <Link className="text-link" to="/blog">
          {c.cta}
          <ArrowUpRight size={17} />
        </Link>
      </Reveal>
      <div className="journal-grid">
        {posts.map((p, i) => (
          <Reveal key={p.id}>
            <BlogCard post={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
