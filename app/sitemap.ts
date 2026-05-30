import type { MetadataRoute } from "next";

import { getPublishedCategories, getPublishedSitemapEntries } from "@/lib/articles";
import { COMPARISONS } from "@/lib/comparisons";
import { FREE_TOOLS } from "@/lib/free-tools";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

function staticSitemapEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1
    },
    {
      url: absoluteUrl("/tools"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: absoluteUrl("/compare"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: absoluteUrl("/monetization-checklist"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65
    },
    {
      url: absoluteUrl("/monetization-audit"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65
    },
    ...COMPARISONS.map((comparison) => ({
      url: absoluteUrl(`/compare/${comparison.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55
    })),
    ...FREE_TOOLS.map((tool) => ({
      url: absoluteUrl(tool.href),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55
    }))
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: Awaited<ReturnType<typeof getPublishedSitemapEntries>> = [];
  let categories: string[] = [];

  try {
    [articles, categories] = await Promise.all([
      getPublishedSitemapEntries(),
      getPublishedCategories()
    ]);
  } catch (error) {
    console.warn(
      "[sitemap] Database unavailable during build; emitting static URLs only.",
      error instanceof Error ? error.message : error
    );
    return staticSitemapEntries();
  }

  return [
    ...staticSitemapEntries(),
    ...categories.map((category) => ({
      url: absoluteUrl(`/${category}`),
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.8
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/${article.category}/${article.slug}`),
      lastModified: article.updated_at ?? article.published_at ?? new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7
    }))
  ];
}
