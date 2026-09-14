import Media from "@/components/Media";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Product } from "@/lib/mockData";
import { useCart } from "@/context/CartContext";
import { content } from "@/content";
import { money } from "@/lib/format";
export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { addToCart } = useCart();
  return (
    <article className={"product-card product-tone-" + index}>
      <div className="product-visual">
        <span className="product-number">
          0{index + 1} / {product.category}
        </span>
        <Link to={"/product/" + product.slug} aria-label={product.name}>
          <Media
            loading="lazy"
            src={product.image}
            alt={product.name + " — " + product.shortDescription}
            width="1000"
            height="1300"
          />
        </Link>
        <button
          className="quick-add"
          onClick={() => addToCart(product)}
          aria-label={"Add " + product.name + " to bag"}
        >
          <Plus size={20} />
        </button>
      </div>
      <Link to={"/product/" + product.slug} className="product-info">
        <div>
          <h3>{product.name}</h3>
          <p>{product.shortDescription}</p>
          <span className="product-price">
            {money(product.salePrice ?? product.price)}
          </span>
        </div>
        <ArrowUpRight size={21} />
      </Link>
    </article>
  );
}
