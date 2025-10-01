import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "src", "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "scripts",
      filename: "sw.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB limit
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        id: "/#/",
        start_url: "/#/",
        scope: "/",
        name: "App",
        short_name: "App",
        description: "Sebuah aplikasi.",
        display: "standalone",
        background_color: "#FFFFFF",
        theme_color: "#d97706",
        icons: [
          {
            src: "/icons/icons8-home-150.png",
            sizes: "150x150",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "images/SplashScreen.scale-400.png",
            sizes: "2480x1200",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "images/SplashScreen.scale-200.png",
            sizes: "1240x600",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "images/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        shortcuts: [
          {
            name: "Tambah Story",
            short_name: "new story",
            description: "Membuat story baru.",
            url: "/?source=pwa#/add-story",
            icons: [
              {
                src: "/icons/icons8-home-150.png",
                sizes: "150x150",
                type: "image/png",
              },
            ],
          },
        ],
      },
    }),
  ],
  server: {
    headers: {
      "Service-Worker-Allowed": "/",
    },
  },
});
