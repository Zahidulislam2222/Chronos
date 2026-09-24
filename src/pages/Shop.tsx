import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { fetchProducts } from "@/utils/api";
import { content } from "@/content";
export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "featured";
  const {
    data = [],
    isPending,
    isError,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const products = data
    .filter(
      (p) =>
        (!category || p.category === category) &&
        [p.name, p.description, p.shortDescription]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : 0,
    );
  return (
    <Layout>
      <div className="page-intro container">
        <p className="eyebrow">{content.collection.eyebrow}</p>
        <h1>{content.ui.shopTitle}</h1>
        <p>{content.ui.shopIntro}</p>
      </div>
      <section className="container shop-section">
        <div className="shop-toolbar">
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">{content.ui.search}</span>
            <input
              autoFocus={params.has("search")}
              value={q}
              onChange={(e) => update("q", e.target.value)}
              placeholder={content.ui.searchPlaceholder}
            />
            {q && (
              <button
                aria-label={content.ui.clearSearch}
                onClick={() => update("q", "")}
              >
                <X size={17} />
              </button>
            )}
          </label>
          <label className="sort-field">
            {content.ui.sort}
            <select
              value={sort}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="featured">{content.ui.featured}</option>
              <option value="low">{content.ui.low}</option>
              <option value="high">{content.ui.high}</option>
              <option value="name">{content.ui.name}</option>
            </select>
          </label>
        </div>
        <div className="filter-row">
          <div>
            {["", ...new Set(data.map((p) => p.category))].map((c) => (
              <button
                className={category === c ? "selected" : ""}
                key={c}
                onClick={() => update("category", c)}
              >
                {c || content.ui.all}
              </button>
            ))}
          </div>
          <span>{products.length} timepieces</span>
        </div>
        {isPending ? (
          <p role="status">{content.ui.loading}</p>
        ) : isError ? (
          <div role="alert">
            {content.ui.failure}
            <button onClick={() => refetch()}>{content.ui.retry}</button>
          </div>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((p, i) => (
              <Reveal key={p.id}>
                <ProductCard product={p} index={i} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{content.ui.noResults}</p>
            <button className="text-link" onClick={() => setParams({})}>
              {content.ui.clear}
            </button>
          </div>
        )}
        <p className="catalogue-note">{content.preview.notice}</p>
      </section>
    </Layout>
  );
}
