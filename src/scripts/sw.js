import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
} from "workbox-strategies";

import CONFIG from "./config";

console.log("Service worker module loaded");

// ✅ precache semua file hasil build
precacheAndRoute(self.__WB_MANIFEST);

// ✅ Cache untuk file static lokal (ikon marker, shadow, css, dll)
registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "worker" ||
    request.destination === "image", // termasuk marker-icon.png
  new CacheFirst({
    cacheName: "static-assets",
  })
);
// cache openstreetmap
registerRoute(
  ({ request }) =>
    request.destination === "image" && request.url.includes("/images/"),
  new CacheFirst({
    cacheName: "static-images",
  })
);
// ✅ Cache API non-image (misal JSON, halaman HTML dynamic)
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin && request.destination !== "image",
  new NetworkFirst({ cacheName: "mystory-api" })
);

// ✅ Cache API image dari BASE_URL (foto story)
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return baseUrl.origin === url.origin && request.destination === "image";
  },
  new StaleWhileRevalidate({
    cacheName: "mystory-api-images",
  })
);

// ✅ Cache Map tiles (OpenStreetMap / MapTiler)
registerRoute(
  ({ url }) =>
    url.origin.includes("maptiler") ||
    url.origin.includes("tile.openstreetmap.org"),
  new CacheFirst({
    cacheName: "map-tiles",
  })
);

// ✅ Cache untuk API Dicoding
registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new NetworkFirst({
    cacheName: "dicoding-story-api",
  })
);

// ✅ Push notification
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Pesan Masuk",
      options: {
        body: event.data ? event.data.text() : "No content",
        icon: "/icons/icon-192x192.png",
        actions: [
          { action: "open_detail", title: "Lihat Detail" },
          { action: "dismiss", title: "Tutup" },
        ],
      },
    };
  }
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
self.skipWaiting();
self.clients.claim();
