import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Menu, UserRound } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";
import { content } from "@/content";
import { useSite } from "@/hooks/use-site";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { navigationSettings } from "@/config/navigation";
export default function Navbar() {
  const site = useSite();
  const navigation = [...(site.data?.navigation ?? content.nav), ...navigationSettings.supplementalLinks]
    .filter((link, index, links) => links.findIndex(item => item.href === link.href) === index);
  const opener = useRef<HTMLButtonElement | null>(null);
  const { totalItems, toggleCart, state: cart } = useCart();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { headerRef, hidden, scrolled } = useScrollHeader(pathname, open || cart.isOpen);
  return (
    <header
      ref={headerRef}
      className={["site-header", pathname === "/" && "header-home", pathname === "/" && !scrolled && "on-dark", hidden && "header-hidden", scrolled && "header-scrolled"].filter(Boolean).join(" ")}
    >
      <div className="nav-inner">
        <Link to="/" className="wordmark" aria-label="Chronos home">
          {content.brand.name}
          <span>{content.ui.markTagline}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((n) => (
            <Link
              className={pathname === n.href ? "active" : ""}
              aria-current={pathname === n.href ? "page" : undefined}
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
            ref={opener}
            onClick={() => setOpen(true)}
            aria-label={content.ui.openNavigation}
            aria-expanded={open}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener.current?.isConnected) opener.current.focus();
          }}
        >
          <SheetTitle className="wordmark">{content.brand.name}</SheetTitle>
          <SheetDescription>{content.brand.tagline}</SheetDescription>
          <nav className="mobile-links" aria-label="Mobile navigation">
            {navigation.map((n) => (
              <Link key={n.href} to={n.href} aria-current={pathname === n.href ? "page" : undefined} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
