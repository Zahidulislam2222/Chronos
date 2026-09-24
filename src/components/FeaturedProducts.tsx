import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import { content } from "@/content";
import type { Product } from "@/lib/mockData";
export default function FeaturedProducts({
  products,
}: {
  products: Product[];
}) {
  const c = content.collection;
  return (
    <section id="collection" className="section container">
      <Reveal className="section-heading">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2>{c.title}</h2>
          <p>{c.description}</p>
        </div>
        <Link className="text-link" to="/shop">
          {c.cta}
          <ArrowUpRight size={17} />
        </Link>
      </Reveal>
      <div className="product-grid">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <ProductCard product={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
