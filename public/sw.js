// App-shell service worker for Karen & JJ Moto Rental.
//
// Goals:
//  - make the site installable as a PWA on iOS/Android (presence of an SW
//    is required by Chrome's install criteria);
//  - serve a cached app shell when offline so the admin keeps opening even
//    if the network is flaky in Popoyo;
//  - never get in the way of Convex API calls — those go to a different
//    origin (convex.cloud) and we don't respondWith for cross-origin
//    requests, so they fall through to the network as normal.
//
// Bump CACHE_VERSION when shipping assets you want clients to re-fetch.
const CACHE_VERSION = "kj-moto-v1";
const APP_SHELL = [
  "/",
  "/admin",
  "/index.html",
  "/admin/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Don't fail the install if a single optional asset 404s.
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Only handle same-origin requests. Convex (convex.cloud), Google Fonts,
  // etc. fall through to the network untouched.
  if (url.origin !== self.location.origin) return;

  // SPA navigation — try network so updates roll out quickly, fall back to
  // the cached shell if offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then((cached) =>
          cached || caches.match("/index.html") || caches.match("/")
        )
      )
    );
    return;
  }

  // Hashed Vite build assets are immutable — cache-first, fall back to net.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
      )
    );
    return;
  }

  // Everything else same-origin: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
