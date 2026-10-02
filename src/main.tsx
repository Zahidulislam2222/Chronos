import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./cinema.css";

document.documentElement.classList.remove("prerendered");
// React 19 hoists SEOHead's tags into <head> itself and does not adopt the
// static or prerendered copies, so drop them before the first render.
document.head.querySelectorAll("[data-chronos-head]").forEach((node) => node.remove());
createRoot(document.getElementById("root")!).render(<App />);
