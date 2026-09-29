import type { MetadataRoute } from "next";
import { durations, getDurationHref, getWordHref, wordCounts } from "@/lib/typing-modes";

const siteUrl = "https://typingtestskill.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/typing-test", "/typing-practice", "/word-typing", "/about", "/blogs", "/contact"];
  const timedRoutes = durations.flatMap((duration) => [
    getDurationHref("test", duration),
    getDurationHref("practice", duration),
  ]);
  const wordRoutes = wordCounts.map((count) => getWordHref(count));

  return [...staticRoutes, ...timedRoutes, ...wordRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.split("/").length === 2 ? 0.8 : 0.7,
  }));
}