import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { preloadRoute } from "./routes";
import "./lib/head";
import "./index.css";
import "./cinema.css";

// Render once the current page's code is loaded so React does not suspend and
// replace the prerendered page with the loader. If that code cannot load, keep
// the prerendered page (its links still work as full page loads) rather than
// let React replace it with an error; an empty shell renders anyway.
const root = document.getElementById("root")!;
preloadRoute(window.location.pathname)
  .then(() => true, () => root.childElementCount === 0)
  .then((render) => {
    if (!render) return;
    // Keeps .reveal content visible on the prerendered page until React takes over.
    document.documentElement.classList.remove("prerendered");
    createRoot(root).render(<App />);
  });
