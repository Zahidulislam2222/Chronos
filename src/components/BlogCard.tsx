import Media from "@/components/Media";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { BlogPost } from "@/lib/mockData";
export default function BlogCard({
  post,
  index = 0,
}: {
  post: BlogPost;
  index?: number;
}) {
  return (
    <Link
      className={"journal-card journal-tone-" + index}
      to={"/blog/" + post.slug}
    >
      <div className="journal-image">
        <Media src={post.featuredImage} alt="" loading="lazy" />
        <span>0{index + 1}</span>
      </div>
      <div className="journal-meta">
        <span>{post.category}</span>
        <span>{post.readTime}</span>
      </div>
      <div className="journal-title">
        <h3>{post.title}</h3>
        <ArrowUpRight size={22} />
      </div>
      <p>{post.excerpt}</p>
    </Link>
  );
}
