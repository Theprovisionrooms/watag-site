// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Source for the generated service worker. vite-plugin-pwa (in
// injectManifest mode, see vite.config.js) injects the list of files
// to precache at the self.__WB_MANIFEST line below, and bundles this
// whole file into dist/sw.js at build time. Don't edit dist/sw.js
// directly, it's regenerated on every build.

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

// API calls always go to the network, never served from cache
registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly());

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "WATAG", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());
