import { getPublishedArticles } from "@/lib/articles";
import { BUSINESS_DATA_CATEGORIES } from "@/lib/business-data-categories";
import { getRecommendedToolsForText } from "@/lib/tool-recommendations";

export type LoadingSuggestion = {
  href: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  type: "tool" | "article";
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  restaurant: ["restaurant", "local business", "marketing", "seo", "google"],
  cafe: ["cafe", "local business", "marketing", "seo"],
  store: ["retail", "ecommerce", "local business", "marketing"],
  doctor: ["health", "local business", "marketing", "seo"],
  dentist: ["health", "local business", "marketing"],
  gym: ["fitness", "local business", "marketing"],
  lawyer: ["professional services", "local business", "seo"],
  real_estate_agency: ["real estate", "local business", "marketing"]
};

function categoryLabel(category: string) {
  return (
    BUSINESS_DATA_CATEGORIES.find((item) => item.value === category)?.label ?? category
  );
}

function scoreArticle(input: {
  title: string;
  metaDescription: string;
  category: string;
  keywords: string[];
}) {
  const haystack = `${input.title} ${input.metaDescription} ${input.category}`.toLowerCase();

  return input.keywords.reduce((score, keyword) => {
    return haystack.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

export async function getBusinessDataLoadingSuggestions(input: {
  category: string;
  location: string;
  limit?: number;
}) {
  const limit = input.limit ?? 8;
  const keywords = [
    categoryLabel(input.category),
    input.category.replace(/_/g, " "),
    ...(CATEGORY_KEYWORDS[input.category] ?? ["local business", "marketing", "seo"]),
    ...input.location.split(/[,\s]+/).filter((part) => part.length > 3)
  ];
  const queryText = [input.location, categoryLabel(input.category), ...keywords].join(" ");

  const tools = getRecommendedToolsForText(queryText, Math.ceil(limit / 2), true).map(
    (tool) => ({
      href: tool.href,
      title: tool.title,
      subtitle: tool.description,
      imageUrl: null,
      type: "tool" as const
    })
  );

  const articles = await getPublishedArticles(40);
  const rankedArticles = articles
    .map((article) => ({
      article,
      score: scoreArticle({
        title: article.title,
        metaDescription: article.meta_description,
        category: article.category,
        keywords
      })
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.ceil(limit / 2))
    .map(({ article }) => ({
      href: `/${article.category}/${article.slug}`,
      title: article.title,
      subtitle: article.meta_description,
      imageUrl: article.image_url,
      type: "article" as const
    }));

  const combined = [...tools, ...rankedArticles].slice(0, limit);

  if (combined.length >= 4) {
    return combined;
  }

  const fallbackArticles = articles
    .filter((article) => !combined.some((item) => item.href.includes(article.slug)))
    .slice(0, limit - combined.length)
    .map((article) => ({
      href: `/${article.category}/${article.slug}`,
      title: article.title,
      subtitle: article.meta_description,
      imageUrl: article.image_url,
      type: "article" as const
    }));

  return [...combined, ...fallbackArticles].slice(0, limit);
}
