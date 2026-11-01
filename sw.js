// Interval Workshop: hors connexion / offline
const CACHE = "interval-workshop-20261101230845";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("interval-workshop-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function save(req, res) {
  if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
}
function withTimeout(p, ms) {
  return new Promise((ok, ko) => { const t = setTimeout(() => ko(new Error("timeout")), ms); p.then(v => { clearTimeout(t); ok(v); }, err => { clearTimeout(t); ko(err); }); });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    // Pages: try the network briefly so updates arrive, otherwise use the saved copy.
    e.respondWith(
      withTimeout(fetch(req), 4000).then(res => save(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(m => m || caches.match("./index.html")))
    );
    return;
  }
  // Icons, manifest: saved copy first.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(m => m || fetch(req).then(res => save(req, res))));
});
