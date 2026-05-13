import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { I18nProvider } from "./i18n/I18nContext";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ConvexProvider>
  </React.StrictMode>
);

// PWA service worker. Registered after window load so it doesn't compete
// with the initial paint. Skipped under `vite dev` since the SW is served
// from /public/ only in builds.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch((err) => console.warn("SW register failed:", err));
  });
}
