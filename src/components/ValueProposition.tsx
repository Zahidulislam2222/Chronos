import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { content } from "@/content";
import ScrollFilm from "./ScrollFilm";
export default function ValueProposition() {
  const c = content.craft;
  return (
    <ScrollFilm scene="study" className="cinema-study">
      <div className="study-shade" />
      <div className="study-intro">
        <p className="eyebrow">{c.eyebrow}</p>
        <h2>
          {c.title}
          <em>{c.italic}</em>
        </h2>
        <p>{c.description}</p>
        <Link className="text-link" to={c.href}>
          {c.cta}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="study-caption">
        <span>{c.scroll}</span>
        <p>{c.disclaimer}</p>
      </div>
      <div className="study-note">
        <span>{c.details[2].label}</span>
        <h3>{c.details[2].title}</h3>
      </div>
    </ScrollFilm>
  );
}
