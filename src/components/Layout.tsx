import SEOHead from "./SEOHead";
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <MotionConfig reducedMotion="user">
      <div className="site-shell">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SEOHead />
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </MotionConfig>
  );
}
