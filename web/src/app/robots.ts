import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/library", "/account", "/auth/callback", "/results/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
