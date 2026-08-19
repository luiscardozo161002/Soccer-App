import type { MetadataRoute } from "next";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

// The public site is a single page with in-page anchors (#tabla, #equipos,
// #proximos-partidos) rather than separate routes, so there's only one URL
// to list — everything else (/admin, /login, ...) is intentionally excluded
// via robots.ts, not meant for search indexing.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
