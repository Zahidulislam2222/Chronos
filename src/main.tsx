import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./cinema.css";

document.documentElement.classList.remove("prerendered");
createRoot(document.getElementById("root")!).render(<App />);
