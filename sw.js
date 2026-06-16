/* CMS Billing Tracker — service worker
   Caches the app shell so it opens offline and can be installed to desktop.
   The Firebase SDK and live data always go to the network. */
const CACHE = "cms-billing-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./logo.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = e.request.url;
  // Never cache Firebase / Google traffic — always go to network for live data.
  if (url.includes("gstatic.com") || url.includes("googleapis.com") || url.includes("firebase")) return;
  if (e.request.method !== "GET") return;
  // Cache-first for the app shell, network fallback for everything else.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});
