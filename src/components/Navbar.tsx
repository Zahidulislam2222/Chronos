import { useRef } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Menu, UserRound } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";
import { content } from "@/content";
import { useSite } from "@/hooks/use-site";
export default function Navbar() {
  const site = useSite();
  const navigation = site.data?.navigation ?? content.nav;
  const opener = useRef<HTMLElement | null>(null);
  const { totalItems, toggleCart } = useCart();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <header className={"site-header " + (pathname === "/" ? "on-dark" : "")}>
      <div className="nav-inner">
        <Link to="/" className="wordmark" aria-label="Chronos home">
          {content.brand.name}
          <span>{content.ui.markTagline}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((n) => (
            <Link
              className={pathname === n.href ? "active" : ""}
              key={n.href}
              to={n.href}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link
            className="icon-button"
            to="/shop?search=1"
            aria-label={content.ui.search}
          >
            <Search size={19} />
          </Link>
          <Link
            className="icon-button account-link"
            to="/account"
            aria-label={content.ui.yourAccount}
          >
            <UserRound size={19} />
          </Link>
          <button
            className="icon-button bag-toggle"
            onClick={toggleCart}
            aria-label={`Open bag, ${totalItems} items`}
          >
            <ShoppingBag size={19} />
            <span>{totalItems}</span>
          </button>
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(true)}
            aria-label={content.ui.openNavigation}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener.current?.isConnected) opener.current.focus();
          }}
        >
          <SheetTitle className="wordmark">{content.brand.name}</SheetTitle>
          <SheetDescription>{content.brand.tagline}</SheetDescription>
          <nav className="mobile-links" aria-label="Mobile navigation">
            {navigation.map((n) => (
              <Link key={n.href} to={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <Link to="/contact">Contact</Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
