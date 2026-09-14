import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { BagItems } from "@/components/CartDrawer";
import { useCart } from "@/context/CartContext";
import { content } from "@/content";
import { money } from "@/lib/format";
export default function Cart() {
  const { state, totalPrice } = useCart();
  return (
    <Layout>
      <section className="container selection-page">
        <p className="eyebrow">CHRONOS / YOUR COLLECTION</p>
        <h1>{content.ui.bag}</h1>
        {state.items.length ? (
          <>
            <BagItems />
            <div className="bag-total">
              <span>{content.ui.subtotal}</span>
              <strong>{money(totalPrice)}</strong>
            </div>
            <Link className="button button-dark" to="/checkout">
              {content.ui.checkout}
            </Link>
          </>
        ) : (
          <div className="empty-state">
            <h2>{content.ui.emptyBag}</h2>
            <p>{content.ui.emptyText}</p>
            <Link className="button button-dark" to="/shop">
              {content.ui.continue}
            </Link>
          </div>
        )}
      </section>
    </Layout>
  );
}
