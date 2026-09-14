import {lazy, Suspense} from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
const ConnectedCheckout = lazy(() => import("./ConnectedCheckout"));
import { isPreview } from "@/config/settings";
import { content } from "@/content";
import { BagItems } from "@/components/CartDrawer";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/format";
export default function Checkout() {
  const { state, totalPrice } = useCart();
  if (!isPreview) return <Suspense fallback={<p role="status">{content.ui.loading}</p>}><ConnectedCheckout /></Suspense>;
  return (
    <Layout>
      <section className="container selection-page">
        <p className="eyebrow">{content.preview.label}</p>
        <h1>{content.preview.checkout}</h1>
        <p>{content.preview.checkoutDescription}</p>
        {state.items.length ? (
          <>
            <BagItems />
            <div className="bag-total">
              <span>{content.ui.subtotal}</span>
              <strong>{money(totalPrice)}</strong>
            </div>
          </>
        ) : (
          <h2>{content.ui.emptyBag}</h2>
        )}
        <Link className="button button-dark" to="/shop">
          {content.ui.continue}
        </Link>
      </section>
    </Layout>
  );
}
