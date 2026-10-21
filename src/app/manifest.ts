import type { MetadataRoute } from "next";

// PWA baseline (P1-23). Neutral name and icon so the home screen stays discreet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Intimo",
    short_name: "Intimo",
    description: "Prague's sex-positive community.",
    start_url: "/people",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#191C20",
    theme_color: "#191C20",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
