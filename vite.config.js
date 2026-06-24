// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
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
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
