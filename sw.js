/* CMS Billing Tracker — service worker
   Caches the app shell so it opens offline and can be installed to desktop.
   The Firebase SDK and live data always go to the network. */
const CACHE = "cms-billing-shell-v3";
const SHELL = ["./", "./index.html", "./manifest.json", "./logo.png", "./icon.png"];

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
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  // Never touch Firebase / Google traffic — always go to network for live data.
  if (url.includes("gstatic.com") || url.includes("googleapis.com") || url.includes("firebase")) return;
  // Network-first: always show the latest when online; fall back to cache when offline.
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
