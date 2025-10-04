import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
} from "workbox-strategies";
import CONFIG from "./config";

console.log("Service worker module loaded");

// 🧹 Bersihkan cache lama
cleanupOutdatedCaches();

// ✅ Precache semua file hasil build
precacheAndRoute(self.__WB_MANIFEST);

// ✅ Cache untuk file static lokal
registerRoute(
  ({ request }) =>
    ["style", "script", "worker", "image"].includes(request.destination),
  new CacheFirst({ cacheName: "static-assets" })
);

// ✅ Cache OpenStreetMap images
registerRoute(
  ({ request }) =>
    request.destination === "image" && request.url.includes("/images/"),
  new CacheFirst({ cacheName: "static-images" })
);

// ✅ Cache API non-image lokal
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    request.destination !== "image" &&
    !url.protocol.startsWith("blob") &&
    !url.protocol.startsWith("file"),
  new NetworkFirst({ cacheName: "mystory-api" })
);

// ✅ Cache API image Dicoding
registerRoute(({ request, url }) => {
  const baseUrl = new URL(CONFIG.BASE_URL);
  return baseUrl.origin === url.origin && request.destination === "image";
}, new StaleWhileRevalidate({ cacheName: "mystory-api-images" }));

// ✅ Cache Map tiles
registerRoute(
  ({ url }) =>
    url.origin.includes("maptiler") ||
    url.origin.includes("tile.openstreetmap.org"),
  new CacheFirst({ cacheName: "map-tiles" })
);

// ✅ Cache Dicoding API umum
registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new NetworkFirst({ cacheName: "dicoding-story-api" })
);

// ✅ Push notifications
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
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
  const targetUrl = event.action === "open_detail" ? "/#/detail-page" : "/";
  event.waitUntil(clients.openWindow(targetUrl));
});

// 🧩 Tambahkan event lifecycle yang benar
self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("🛠️ SW diinstall");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      console.log("✅ SW aktif dan kontrol diambil");
    })()
  );
});
