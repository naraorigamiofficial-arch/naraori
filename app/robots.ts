import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/identity";

export default function robots(): MetadataRoute.Robots {
  // Preview/staging deployments must never be indexed.
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NARA_ALLOW_INDEXING !== "0";
  if (!isProduction) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/api/", "/order-request/confirmation/", "/search"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
