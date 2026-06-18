import type { ArticleSummary } from "@/lib/types";
import { CATEGORY_SEO_DESCRIPTIONS, isCoreCategory } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { articleUrl } from "@/lib/seo";

const GLOBAL_HASHTAGS = [
  "#TechRevenueBrief",
  "#DigitalMarketing",
  "#SEO",
  "#ContentMarketing",
  "#Backlinks"
] as const;

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  "ai-tools": ["#AITools", "#Automation", "#SaaS", "#Productivity", "#Founders"],
  "digital-marketing": [
    "#DigitalMarketing",
    "#GrowthMarketing",
    "#MarketingStrategy",
    "#LeadGeneration"
  ],
  seo: ["#SEO", "#SearchEngineOptimization", "#OrganicTraffic", "#LocalSEO", "#LinkBuilding"],
  ecommerce: ["#Ecommerce", "#OnlineBusiness", "#ConversionRate", "#Shopify"],
  startups: ["#Startups", "#Founders", "#GoToMarket", "#Bootstrapping"],
  fintech: ["#Fintech", "#Payments", "#SaaS", "#RevenueOps"],
  "creator-business": ["#CreatorEconomy", "#ContentCreator", "#Monetization", "#AudienceGrowth"],
  others: ["#BusinessNews", "#TechNews", "#TrendingTopics"]
};

const CATEGORY_KEYWORD_PHRASES: Record<string, string[]> = {
  "ai-tools": ["AI tools", "automation", "operator workflows", "SaaS margins"],
  "digital-marketing": [
    "digital marketing",
    "acquisition",
    "campaign strategy",
    "pipeline growth"
  ],
  seo: ["SEO", "organic search", "backlinks", "search visibility", "content strategy"],
  ecommerce: ["ecommerce", "conversion", "retention", "online store growth"],
  startups: ["startups", "founders", "go-to-market", "product launches"],
  fintech: ["fintech", "payments", "financial software", "revenue channels"],
  "creator-business": ["creator business", "audience monetization", "content distribution"],
  others: ["search trends", "timely briefings", "operator context"]
};

function categoryTags(category: string) {
  return CATEGORY_HASHTAGS[category] ?? CATEGORY_HASHTAGS.others;
}

function categoryKeywords(category: string) {
  const base = CATEGORY_KEYWORD_PHRASES[category] ?? CATEGORY_KEYWORD_PHRASES.others;
  const seoLine = isCoreCategory(category)
    ? CATEGORY_SEO_DESCRIPTIONS[category].split(/[,.]/)[0]?.trim()
    : null;

  return seoLine ? [seoLine, ...base] : base;
}

function uniqueHashtags(tags: string[], limit = 12) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`;
    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function takeawayBullets(takeaways: string[], max = 3) {
  return takeaways
    .slice(0, max)
    .map((item) => `• ${item.trim()}`)
    .join("\n");
}

export type ArticleSocialPostBodies = {
  url: string;
  linkedin: string;
  instagram: string;
  hashtags: string[];
  keywords: string[];
};

export function buildArticleSocialPostBodies(
  article: Pick<
    ArticleSummary,
    "title" | "meta_description" | "key_takeaways" | "category" | "slug"
  >
): ArticleSocialPostBodies {
  const url = articleUrl(article);
  const categoryLabel = formatCategory(article.category);
  const keywords = categoryKeywords(article.category);
  const hashtags = uniqueHashtags([
    ...categoryTags(article.category),
    ...GLOBAL_HASHTAGS
  ]);
  const bullets = takeawayBullets(article.key_takeaways);
  const keywordPhrase = keywords.slice(0, 3).join(", ");

  const linkedin = [
    article.title,
    "",
    article.meta_description,
    bullets ? `\nWhat stood out:\n${bullets}` : "",
    "",
    `Full briefing (${categoryLabel} · ${keywordPhrase}):`,
    url,
    "",
    "Tech Revenue Brief — practical briefings for builders, marketers, and operators."
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();

  const instagramHook =
    article.key_takeaways[0]?.trim() ??
    article.meta_description.split(/[.!?]/)[0]?.trim() ??
    article.title;

  const instagram = [
    article.title,
    "",
    instagramHook,
    article.key_takeaways[1] ? `\n${article.key_takeaways[1]}` : "",
    "",
    `Read: ${url}`,
    "",
    hashtags.join(" ")
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();

  return {
    url,
    linkedin,
    instagram,
    hashtags,
    keywords
  };
}
