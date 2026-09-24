import { useRef } from "react";
import Media from "@/components/Media";
import { Link } from "react-router-dom";
import { Minus, Plus, ArrowUpRight, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";
import { content } from "@/content";
import { useMoney } from "@/hooks/use-money";
export function BagItems() {
  const money = useMoney();
  const { state, removeFromCart, updateQuantity } = useCart();
  return (
    <div className="bag-items">
      {state.items.map(({ product: p, quantity }) => (
        <div className="bag-item" key={p.id}>
          <Link to={"/product/" + p.slug}>
            <Media src={p.image} alt={p.name} />
          </Link>
          <div>
            <h3>{p.name}</h3>
            <p>{money(p.salePrice ?? p.price)}</p>
            <div className="quantity">
              <button
                aria-label={"Decrease " + p.name + " quantity"}
                onClick={() => updateQuantity(p.id, quantity - 1)}
              >
                <Minus size={14} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                aria-label={"Increase " + p.name + " quantity"}
                onClick={() => updateQuantity(p.id, quantity + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <button
            className="remove-item"
            aria-label={"Remove " + p.name}
            onClick={() => removeFromCart(p.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
export default function CartDrawer() {
  const money = useMoney();
  const opener = useRef<HTMLElement | null>(null);
  const { state, closeCart, totalPrice } = useCart();
  return (
    <Sheet
      open={state.isOpen}
      onOpenChange={(open) => {
        if (!open) closeCart();
      }}
    >
      <SheetContent
        className="bag-sheet"
        onOpenAutoFocus={() => {
          opener.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (opener.current?.isConnected) opener.current.focus();
        }}
      >
        <SheetTitle className="bag-heading">{content.ui.bag}</SheetTitle>
        <SheetDescription>{content.preview.notice}</SheetDescription>
        {state.items.length ? (
          <>
            <BagItems />
            <div className="bag-total">
              <span>{content.ui.subtotal}</span>
              <strong>{money(totalPrice)}</strong>
            </div>
            <Link
              onClick={closeCart}
              to="/checkout"
              className="button button-dark"
            >
              {content.ui.checkout}
              <ArrowUpRight size={18} />
            </Link>
          </>
        ) : (
          <div className="empty-bag">
            <h3>{content.ui.emptyBag}</h3>
            <p>{content.ui.emptyText}</p>
            <Link onClick={closeCart} to="/shop" className="text-link">
              {content.ui.continue}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
