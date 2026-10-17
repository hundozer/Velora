// Intimo service worker (P1-23). Deliberately minimal and private:
// it caches only a generic offline page, never member content, API
// responses or images, so nothing personal is stored on the device.
const OFFLINE_CACHE = "intimo-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // network only for everything else
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
