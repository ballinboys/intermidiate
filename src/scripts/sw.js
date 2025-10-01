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
  event.waitUntil(
    (async () => {
      const data = event.data.json();
      await self.registration.showNotification(data.title, {
        body: data.options.body,
      });
    })()
  );
});
