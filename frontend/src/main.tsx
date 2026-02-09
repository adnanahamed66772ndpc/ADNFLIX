import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error boundary for initial render
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  const msg = error instanceof Error ? error.message : String(error);
  const div = document.createElement("div");
  div.setAttribute("style", "padding: 20px; font-family: sans-serif;");
  div.innerHTML = "<h1>Application Error</h1><p>Failed to load the application. Please check the console for details.</p><pre id=\"app-error-msg\"></pre>";
  const pre = div.querySelector("#app-error-msg");
  if (pre) pre.textContent = msg;
  document.body.innerHTML = "";
  document.body.appendChild(div);
}
