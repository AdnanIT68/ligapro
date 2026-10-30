import type { MetadataRoute } from "next";

/** Lets organizers and fans add LigaPro to the home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LigaPro",
    short_name: "LigaPro",
    description: "Rasporedi, rezultati i tabele za amaterske lige i turnire.",
    lang: "bs",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
