import type { MetadataRoute } from "next";

// Makes the site installable, and is what Bubblewrap reads to generate the
// Android (Trusted Web Activity) app — name, colors, and launcher icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Riffstub",
    short_name: "Riffstub",
    description: "Keep track of every concert you're going to and every one you've been to.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#2563eb",
    categories: ["music", "entertainment", "social"],
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
