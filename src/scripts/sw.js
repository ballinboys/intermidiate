import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
} from "workbox-strategies";

import CONFIG from "./config";

console.log("Service worker module loaded");

// ✅ Hanya ini saja untuk precache
precacheAndRoute(self.__WB_MANIFEST);

// Routing untuk API non-image
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin && request.destination !== "image",
  new NetworkFirst({ cacheName: "mystory-api" })
);

registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return baseUrl.origin === url.origin && request.destination === "image";
  },
  new StaleWhileRevalidate({
    cacheName: "mystory-api-images",
  })
);

registerRoute(
  ({ url }) => {
    return url.origin.includes("maptiler");
  },
  new CacheFirst({
    cacheName: "maptiler-api",
  })
);

registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new NetworkFirst({
    cacheName: "dicoding-story-api",
  })
);

// Push notification
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "Default",
    options: {
      body: "No content",
      icon: "/icons/icon-192x192.png",
      actions: [
        { action: "open_detail", title: "Lihat Detail" },
        { action: "dismiss", title: "Tutup" },
      ],
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open_detail") {
    event.waitUntil(clients.openWindow("/#/detail-page"));
  } else {
    event.waitUntil(clients.openWindow("/"));
  }
});
