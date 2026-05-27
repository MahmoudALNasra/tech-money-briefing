import { COMPARISONS, type ComparisonPage } from "./comparisons";
import { searchPublishedArticles } from "./articles";
import { getRecommendedToolsForText } from "./tool-recommendations";
import type { Article, ArticleSummary } from "./types";

export type InternalLinkItem = {
  href: string;
  label: string;
  description: string;
  type: "comparison" | "article" | "tool" | "hub";
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "for",
  "from",
  "have",
  "into",
  "that",
  "the",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "your",
  "will",
  "they",
  "their",
  "been",
  "more",
  "than",
  "just",
  "only",
  "over",
  "such",
  "some",
  "how",
  "why",
  "can",
  "does",
  "did",
  "was",
  "were",
  "has",
  "had",
  "not",
  "but",
  "you",
  "all",
  "any",
  "our",
  "its"
]);

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function scoreComparison(text: string, comparison: ComparisonPage) {
  const haystack = normalizeText(text);
  let score = 0;

  for (const keyword of comparison.keywords) {
    score += scoreRule(haystack, normalizeText(keyword));
  }

  const titleTokens = normalizeText(comparison.title).split(/\s+/).filter(Boolean);
  for (const token of titleTokens) {
    if (token.length > 2 && haystack.includes(token)) {
      score += 1;
    }
  }

  const productTokens = normalizeText(
    `${comparison.productA} ${comparison.productB}`
  ).split(/\s+/);
  for (const token of productTokens) {
    if (token.length > 3 && haystack.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function scoreRule(haystack: string, phrase: string) {
  if (!phrase) {
    return 0;
  }

  return haystack.includes(phrase) ? phrase.split(/\s+/).filter(Boolean).length : 0;
}

export function getStaticInternalLinksForText(text: string, limit = 4) {
  const comparisons = getRecommendedComparisons(text, 2);
  const tools = getRecommendedToolsForText(text, 3, true).map((tool) => ({
    href: tool.href,
    label: tool.title,
    description: tool.description,
    type: "tool" as const
  }));

  return [...comparisons, ...tools].slice(0, limit);
}

function getRecommendedComparisons(text: string, limit = 2) {
  return COMPARISONS.map((comparison) => ({
    comparison,
    score: scoreComparison(text, comparison)
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => ({
      href: `/compare/${entry.comparison.slug}`,
      label: entry.comparison.title,
      description: entry.comparison.description,
      type: "comparison" as const
    }));
}

function searchTermsFromTitle(title: string) {
  const words = normalizeText(title)
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

  return [...new Set(words)].slice(0, 4).join(" ");
}

async function getCrossCategoryArticleLink(article: Article) {
  const query = searchTermsFromTitle(article.title);

  if (!query) {
    return null;
  }

  const results = await searchPublishedArticles(query, 6);
  const match = results.find(
    (candidate) =>
      candidate.id !== article.id && candidate.category !== article.category
  );

  if (!match) {
    return null;
  }

  return articleSummaryToLink(match);
}

function articleSummaryToLink(article: ArticleSummary): InternalLinkItem {
  return {
    href: `/${article.category}/${article.slug}`,
    label: article.title,
    description: `Related briefing in ${article.category.replace(/-/g, " ")}`,
    type: "article"
  };
}

export async function getInternalLinksForArticle(article: Article) {
  const haystack = [
    article.title,
    article.meta_description,
    article.category,
    article.key_takeaways.join(" "),
    article.content.slice(0, 2000)
  ].join(" ");

  const comparisons = getRecommendedComparisons(haystack, 2);
  const toolHrefsUsed = new Set(
    getRecommendedToolsForText(haystack, 4, true).map((tool) => tool.href)
  );

  const extraTools = getRecommendedToolsForText(haystack, 6, true)
    .filter((tool) => !toolHrefsUsed.has(tool.href))
    .slice(0, 2)
    .map((tool) => ({
      href: tool.href,
      label: tool.title,
      description: tool.description,
      type: "tool" as const
    }));

  const crossCategory = await getCrossCategoryArticleLink(article);

  const hubs: InternalLinkItem[] = [];

  if (comparisons.length === 0 && extraTools.length === 0) {
    hubs.push(
      {
        href: "/tools",
        label: "Browse free tools",
        description: "Calculators and generators for creators and publishers.",
        type: "hub"
      },
      {
        href: "/compare",
        label: "Browse comparisons",
        description: "Software decision guides for operators and founders.",
        type: "hub"
      }
    );
  }

  const items = [
    ...comparisons,
    ...extraTools,
    ...(crossCategory ? [crossCategory] : []),
    ...hubs
  ].slice(0, 6);

  return items;
}

export function formatInternalLinksMarkdown(
  items: InternalLinkItem[],
  options?: { heading?: string }
) {
  if (items.length === 0) {
    return "";
  }

  const heading = options?.heading ?? "Related on Tech Revenue Brief";
  const lines = items.map((item) => `- [${item.label}](${item.href})`);

  return `## ${heading}\n\n${lines.join("\n")}`;
}
