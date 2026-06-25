import type { MetadataRoute } from "next";

import {
  getAdsenseReviewRobotsDisallow,
  isAdsenseReviewMode
} from "@/lib/adsense-readiness";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallow: string[] = ["/api/", "/others/", "/aseel"];

  if (isAdsenseReviewMode()) {
    disallow.push(...getAdsenseReviewRobotsDisallow());
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
