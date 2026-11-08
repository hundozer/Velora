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

// Web push (Phase 2). Payloads are discreet by design: the title is always
// "Intimo" and the text never names anyone or quotes a message. Nothing from a
// push is cached or stored on the device.
function safePath(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/notifications";
}

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = "Intimo";
  const options = {
    body: typeof data.body === "string" ? data.body.slice(0, 160) : "",
    tag: typeof data.tag === "string" ? data.tag.slice(0, 40) : "intimo",
    renotify: true,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: safePath(data.url) },
  };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    self.navigator && "setAppBadge" in self.navigator ? self.navigator.setAppBadge().catch(() => undefined) : Promise.resolve(),
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(safePath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) return open.focus().then((client) => (client && "navigate" in client ? client.navigate(target) : undefined));
      return self.clients.openWindow(target);
    }),
  );
});
