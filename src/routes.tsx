import { lazy, type ComponentType } from "react";
import { matchRoutes } from "react-router-dom";
import { isPreview } from "@/config/settings";

// Critical pages — loaded eagerly.
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";

type Page = ComponentType & { preload?: () => Promise<void> };

// Code-split page that can be loaded before React's first render. React 19
// keeps a Suspense fallback on screen for at least 300 ms, which would replace
// the prerendered page with the loader; a preloaded page renders without
// suspending.
function lazyPage(load: () => Promise<{ default: ComponentType }>): Page {
  let Loaded: ComponentType | undefined;
  const Lazy = lazy(load);
  const Page: Page = () => (Loaded ? <Loaded /> : <Lazy />);
  Page.preload = () => load().then((module) => { Loaded = module.default; });
  return Page;
}

// Non-critical pages — code-split via lazy loading.
const ProductDetail = lazyPage(() => import("./pages/ProductDetail"));
const Cart = lazyPage(() => import("./pages/Cart"));
const Checkout = lazyPage(() => import("./pages/Checkout"));
const CheckoutSuccess = lazyPage(() => import("./pages/CheckoutSuccess"));
const Blog = lazyPage(() => import("./pages/Blog"));
const BlogPost = lazyPage(() => import("./pages/BlogPost"));
const About = lazyPage(() => import("./pages/About"));
const Contact = lazyPage(() => import("./pages/Contact"));
const Account = lazyPage(() => import("./pages/Account"));
const Privacy = lazyPage(() => import("./pages/Privacy"));
const Accessibility = lazyPage(() => import("./pages/Accessibility"));
const Terms = lazyPage(() => import("./pages/Terms"));
const WordPressPage = lazyPage(() => import("./pages/WordPressPage"));

export const routes: { path: string; Page: Page }[] = [
  { path: "/", Page: Index },
  { path: "/shop", Page: Shop },
  { path: "/product/:slug", Page: ProductDetail },
  { path: "/cart", Page: Cart },
  { path: "/checkout", Page: Checkout },
  { path: "/checkout/success", Page: CheckoutSuccess },
  { path: "/blog", Page: Blog },
  { path: "/blog/:slug", Page: BlogPost },
  { path: "/about", Page: isPreview ? About : WordPressPage },
  { path: "/contact", Page: Contact },
  { path: "/account", Page: Account },
  { path: "/my-account", Page: Account },
  { path: "/privacy", Page: isPreview ? Privacy : WordPressPage },
  { path: "/terms", Page: isPreview ? Terms : WordPressPage },
  { path: "/accessibility", Page: isPreview ? Accessibility : WordPressPage },
  { path: "*", Page: isPreview ? NotFound : WordPressPage },
];

/** Load the code for the page at `pathname` so the first render does not suspend. */
export function preloadRoute(pathname: string): Promise<void> {
  const match = matchRoutes(routes.map(({ path }) => ({ path })), pathname)?.[0];
  const page = routes.find(({ path }) => path === match?.route.path)?.Page;
  return page?.preload?.() ?? Promise.resolve();
}
