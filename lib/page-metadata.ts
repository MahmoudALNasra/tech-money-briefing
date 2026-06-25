import type { Metadata } from "next";

import { adsenseReviewPageRobots } from "@/lib/adsense-readiness";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const siteSocialProfiles = {
  instagram: "https://www.instagram.com/techrevenuebrief/",
  linkedin: "https://www.linkedin.com/company/tech-revenue-brief",
  github: "https://github.com/Tech-Revenue-Brief",
  crunchbase: "https://www.crunchbase.com/organization/tech-revenue-brief"
} as const;

export const siteSocialProfileUrls = Object.values(siteSocialProfiles);

export const defaultOgImage = {
  url: absoluteUrl("/og-default-v3.png"),
  width: 1200,
  height: 630,
  alt: siteConfig.name
};

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  keywords?: string[];
  robots?: Metadata["robots"];
  publishedTime?: string;
  section?: string;
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image ?? defaultOgImage;
  const imageAlt = image.alt ?? input.title;
  const robots = input.robots ?? adsenseReviewPageRobots(input.path);

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    robots,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: input.type ?? "website",
      url,
      title: input.title,
      description: input.description,
      siteName: siteConfig.name,
      publishedTime: input.publishedTime,
      section: input.section,
      images: [
        {
          url: image.url,
          width: image.width ?? 1200,
          height: image.height ?? 630,
          alt: imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image.url]
    }
  };
}
