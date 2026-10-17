import type { MetadataRoute } from "next";

// PWA baseline (P1-23). Neutral name and icon so the home screen stays discreet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Intimo",
    short_name: "Intimo",
    description: "Prague's private, sex-positive network.",
    start_url: "/people",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0B0E",
    theme_color: "#0A0B0E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
