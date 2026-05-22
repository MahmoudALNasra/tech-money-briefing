import type { MetadataRoute } from "next";

import { getPublishedCategories, getPublishedSitemapEntries } from "@/lib/articles";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    getPublishedSitemapEntries(),
    getPublishedCategories()
  ]);

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1
    },
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
