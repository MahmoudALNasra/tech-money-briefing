import type { MetadataRoute } from "next";

import { isAdsenseReviewMode } from "@/lib/adsense-readiness";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallow: string[] = ["/api/", "/others/", "/aseel"];

  if (isAdsenseReviewMode()) {
    disallow.push(
      "/tools",
      "/compare",
      "/leads",
      "/local-business-insights",
      "/login",
      "/signup",
      "/profile",
      "/admin",
      "/analytics"
    );
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url
  };
}
