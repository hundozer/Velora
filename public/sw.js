// Only the generic offline document is cached; never member content.
const OFFLINE_CACHE = "intimo-offline-v3";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE)
    .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith("intimo-offline-") && key !== OFFLINE_CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function navigate(request) {
  try {
    return await fetch(request);
  } catch {
    // Retry only safe GET navigations. Never replay a form submission.
    if (request.method !== "GET") return Response.error();
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return await fetch(request);
    } catch {
      const cache = await caches.open(OFFLINE_CACHE);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  event.respondWith(navigate(event.request));
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
