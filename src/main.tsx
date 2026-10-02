import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { preloadRoute } from "./routes";
import "./lib/head";
import "./index.css";
import "./cinema.css";

// Render once the current page's code is loaded so React does not suspend and
// replace the prerendered page with the loader. A failed load renders anyway.
preloadRoute(window.location.pathname)
  .catch(() => undefined)
  .finally(() => {
    // Keeps .reveal content visible on the prerendered page until React takes over.
    document.documentElement.classList.remove("prerendered");
    createRoot(document.getElementById("root")!).render(<App />);
  });
