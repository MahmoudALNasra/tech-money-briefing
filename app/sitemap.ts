import type { MetadataRoute } from "next";

import {
  ADSENSE_TRUST_PAGES,
  isAdsenseReviewMode,
  isAdsenseHiddenCategory
} from "@/lib/adsense-readiness";
import {
  ARTICLES_PER_PAGE,
  getPublishedCategories,
  getPublishedSitemapEntries
} from "@/lib/articles";
import { COMPARISONS } from "@/lib/comparisons";
import { FREE_TOOLS } from "@/lib/free-tools";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

function staticSitemapEntries(): MetadataRoute.Sitemap {
  const reviewMode = isAdsenseReviewMode();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1
    },
    ...(reviewMode
      ? []
      : ([
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
        ] as MetadataRoute.Sitemap)),
    ...ADSENSE_TRUST_PAGES.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5
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

  const homepageArticleCount = articles.filter(
    (article) => !isAdsenseHiddenCategory(String(article.category))
  ).length;
  const homepagePageCount = Math.max(
    1,
    Math.ceil(homepageArticleCount / ARTICLES_PER_PAGE)
  );
  const homepagePaginationEntries = Array.from(
    { length: Math.max(homepagePageCount - 1, 0) },
    (_, index) => index + 2
  ).map((page) => ({
    url: absoluteUrl(`/?page=${page}`),
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.75
  }));

  return [
    ...staticSitemapEntries(),
    ...homepagePaginationEntries,
    ...categories
      .filter((category) => !isAdsenseHiddenCategory(category))
      .map((category) => ({
        url: absoluteUrl(`/${category}`),
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.8
      })),
    ...articles
      .filter((article) => !isAdsenseHiddenCategory(String(article.category)))
      .map((article) => ({
        url: absoluteUrl(`/${article.category}/${article.slug}`),
        lastModified: article.updated_at ?? article.published_at ?? new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7
      }))
  ];
}
