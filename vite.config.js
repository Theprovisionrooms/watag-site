// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// strategies: "injectManifest" rather than the default "generateSW".
// generateSW auto-builds a service worker from config and doesn't
// support adding custom event listeners, injectManifest takes our own
// service worker source (src/sw.js) and injects the precache manifest
// into it, so push and notificationclick handlers can live alongside
// the offline caching Vite/Workbox still sets up automatically.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      includeAssets: ["icons/rabbit-source.png"],
      manifest: {
        name: "WATAG",
        short_name: "WATAG",
        description: "WATAG tattoo studio. Loyalty card, bookings, gallery and shop.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0A0A12",
        theme_color: "#E91E8C",
        orientation: "portrait",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      injectManifest: {
        injectionPoint: "self.__WB_MANIFEST",
      },
    }),
  ],
});
