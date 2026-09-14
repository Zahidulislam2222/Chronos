import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { content } from "@/content";
import Reveal from "./Reveal";
export default function Newsletter() {
  const c = content.closing;
  return (
    <section className="life-section">
      <img
        src={c.image}
        alt="The Nocturne worn with a linen jacket in afternoon light"
        loading="lazy"
      />
      <Reveal className="life-copy">
        <p className="eyebrow">{c.eyebrow}</p>
        <h2>
          {c.title}
          <em>{c.italic}</em>
        </h2>
        <p>{c.description}</p>
        <Link className="cinema-button" to={c.href}>
          {c.cta}
          <span>
            <ArrowUpRight size={20} />
          </span>
        </Link>
      </Reveal>
    </section>
  );
}
