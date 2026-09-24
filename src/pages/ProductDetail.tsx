import { useState } from "react";
import Media from "@/components/Media";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Maximize2 } from "lucide-react";
import Layout from "@/components/Layout";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchProductBySlug } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useMoney } from "@/hooks/use-money";
import { content } from "@/content";
import WordPressContent from "@/components/WordPressContent";
export default function ProductDetail() {
  const money = useMoney();
  const [selected, setSelected] = useState<string | null>(null);
  const { slug = "" } = useParams();
  const {
    data: p,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });
  const { addToCart } = useCart();
  if (!p)
    return (
      <Layout>
        <div className="container section">
          <h1>
            {isPending
              ? content.ui.loading
              : isError
                ? content.ui.failure
                : content.ui.productNotFound}
          </h1>
          {isError && (
            <button onClick={() => refetch()}>{content.ui.retry}</button>
          )}
          <Link to="/shop" className="text-link">
            {content.ui.back}
          </Link>
        </div>
      </Layout>
    );
  const currentImage =
    selected && p.gallery.includes(selected) ? selected : p.image;
  return (
    <Layout>
      <section className="container product-page">
        <Link to="/shop" className="back-link">
          <ArrowLeft size={15} />
          {content.ui.back}
        </Link>
        <div className="product-detail-grid">
          <div className="product-gallery">
            <Dialog>
              <div className="detail-visual">
                <span className="eyebrow">{p.category} / CHRONOS</span>
                <DialogTrigger
                  className="image-zoom"
                  aria-label={"Enlarge " + p.name + " image"}
                >
                  <Media src={currentImage} alt={p.name} />
                  <span>
                    <Maximize2 size={19} />
                    {content.ui.gallery}
                  </span>
                </DialogTrigger>
              </div>
              <DialogContent className="gallery-dialog">
                <DialogTitle>{p.name}</DialogTitle>
                <DialogDescription>{p.shortDescription}</DialogDescription>
                <Media src={currentImage} alt={p.name + " enlarged detail"} />
              </DialogContent>
            </Dialog>
            {p.gallery.length > 1 && (
              <div
                className="gallery-thumbnails"
                aria-label={content.ui.gallery}
              >
                {p.gallery.map((src, i) => (
                  <button
                    key={src}
                    aria-label={`View ${p.name} image ${i + 1}`}
                    aria-pressed={currentImage === src}
                    onClick={() => setSelected(src)}
                  >
                    <Media src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">THE COLLECTOR’S EDIT</p>
            <h1>{p.name}</h1>
            <p className="detail-subtitle">{p.shortDescription}</p>
            <p className="detail-price">{money(p.salePrice ?? p.price)}</p>
            <WordPressContent html={p.description} />
            <button
              className="button button-dark"
              onClick={() => addToCart(p)}
              disabled={!p.inStock}
            >
              {p.inStock ? content.ui.add : content.ui.unavailable}
              <ArrowUpRight size={18} />
            </button>
            <p className="product-note">{content.ui.productNote}</p>
            <h2 className="spec-heading">{content.ui.specs}</h2>
            <dl className="specifications">
              {Object.entries(p.specifications).map(([k, v]) => (
                <div key={k}>
                  <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </Layout>
  );
}
