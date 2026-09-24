import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { content } from "@/content";
import ScrollFilm from "./ScrollFilm";
export default function Hero() {
  const c = content.hero;
  return (
    <ScrollFilm scene="hero" className="cinema-hero">
      <div className="cinema-shade" />
      <div className="cinema-copy">
        <p className="eyebrow">{c.eyebrow}</p>
        <h1>
          {c.title}
          <span>{c.italic}</span>
        </h1>
        <p className="cinema-description">{c.description}</p>
        <Link to="/shop" className="cinema-button">
          {c.cta}
          <span>
            <ArrowUpRight size={20} />
          </span>
        </Link>
      </div>
      <div className="cinema-bottom">
        <a href="#collection">
          <ArrowDown size={16} />
          <span>{c.caption}</span>
        </a>
        <Link to={c.href}>
          <span>
            {c.product}
            <small>{c.detail}</small>
          </span>
          <ArrowUpRight size={22} />
        </Link>
      </div>
      <div className="cinema-end" aria-hidden="true">
        <span>{c.product}</span>
        <small>{c.detail}</small>
      </div>
    </ScrollFilm>
  );
}
