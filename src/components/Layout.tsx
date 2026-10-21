import SEOHead from "./SEOHead";
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import AssistantGuide from "./AssistantGuide";
import "@/assistant.css";
import { assistantEnabled } from "@/config/assistant";
import { useRenderReadiness } from "@/hooks/use-render-readiness";
import { renderStateAttribute } from "@/lib/render-readiness.mjs";
export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const renderState = useRenderReadiness();
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
        <main id="main-content" tabIndex={-1} {...{[renderStateAttribute]: renderState}}>
          {children}
        </main>
        <Footer />
        <CartDrawer />
        {assistantEnabled && <AssistantGuide />}
      </div>
    </MotionConfig>
  );
}
