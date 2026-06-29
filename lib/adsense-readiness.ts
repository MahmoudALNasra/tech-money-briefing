import { OWNER_VOICE_SKIP_SLUGS } from "./article-attribution";
import { CORE_CATEGORIES, type CoreCategory } from "./categories";
import { COMPARISONS } from "./comparisons";
import { FREE_TOOLS } from "./free-tools";

export const ADSENSE_HIDDEN_CATEGORIES = ["others"] as const;

export const TREND_NOISE_TITLE_PATTERNS = [
  "techcrunch disrupt",
  "startup battlefield",
  "early bird",
  "ticket",
  "tickets",
  "world cup",
  "live updates",
  "live stream",
  "match preview",
  "match details",
  "what you need to know about the upcoming match"
] as const;

/** Titles that read as thin trend/celebrity/sports noise to human reviewers. */
export const ADSENSE_LOW_VALUE_TITLE_PATTERNS = [
  ...TREND_NOISE_TITLE_PATTERNS,
  "divorce",
  "split from",
  "rumors",
  "highlights from",
  "highlights and key",
  "key moments from",
  "match against",
  "opener against",
  "remembering ",
  "passed away",
  "jelly roll",
  "euphoria",
  "korea vs",
  "norway vs",
  "usa soccer",
  "nfl",
  "nba",
  "mlb",
  "soccer key",
  "world cup opener",
  "celebrity",
  "red carpet",
  "dating rumors"
] as const;

export const ADSENSE_TRUST_PAGES = [
  "/about",
  "/contact",
  "/editorial-policy",
  "/privacy",
  "/terms",
  "/advertise"
] as const;

const ADSENSE_REVIEW_UTILITY_PREFIXES = [
  "/tools",
  "/compare",
  "/leads",
  "/local-business-insights",
  "/login",
  "/signup",
  "/profile",
  "/admin",
  "/analytics",
  "/brush-the-algorithm",
  "/doomscroll-dodge",
  "/doomscroll-market",
  "/meme-market",
  "/aseel"
] as const;

export function isAdsenseReviewMode() {
  return process.env.ADSENSE_REVIEW_MODE === "true";
}

/** When true with review mode, compares/tools stay indexable while nav and publish throttles remain. */
export function isAdsenseReviewAllowIndexing() {
  return process.env.ADSENSE_REVIEW_ALLOW_INDEXING === "true";
}

export function isAdsenseReviewSeoBlocked() {
  return isAdsenseReviewMode() && !isAdsenseReviewAllowIndexing();
}

export function getAdsenseReviewRobotsDisallow() {
  if (!isAdsenseReviewSeoBlocked()) {
    return [] as string[];
  }

  const toolPaths = FREE_TOOLS.map((tool) => tool.href);
  const comparisonPaths = COMPARISONS.map(
    (comparison) => `/compare/${comparison.slug}`
  );

  return Array.from(
    new Set([
      ...ADSENSE_REVIEW_UTILITY_PREFIXES,
      ...toolPaths,
      ...comparisonPaths
    ])
  );
}

export function isAdsenseReviewNoindexPath(pathname: string) {
  if (!isAdsenseReviewSeoBlocked()) {
    return false;
  }

  const normalized = pathname.split("?")[0] ?? pathname;

  return getAdsenseReviewRobotsDisallow().some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function adsenseReviewPageRobots(path: string) {
  if (isAdsenseReviewNoindexPath(path)) {
    return {
      index: false,
      follow: true
    } as const;
  }

  return undefined;
}

export function getAdsenseReviewPublishLimits() {
  if (!isAdsenseReviewMode()) {
    return null;
  }

  return {
    maxRssArticles: Number(process.env.ADSENSE_REVIEW_MAX_RSS ?? 2),
    maxEditorialArticles: Number(process.env.ADSENSE_REVIEW_MAX_EDITORIAL ?? 1),
    maxTrendsArticles: Number(process.env.ADSENSE_REVIEW_MAX_TRENDS ?? 0)
  };
}

export function isAdsenseHiddenCategory(category: string) {
  return ADSENSE_HIDDEN_CATEGORIES.includes(
    category as (typeof ADSENSE_HIDDEN_CATEGORIES)[number]
  );
}

export function getPublicNavCategories(): readonly CoreCategory[] {
  return CORE_CATEGORIES.filter((category) => !isAdsenseHiddenCategory(category));
}

export function shouldHideArticleForAdsense(article: {
  title: string;
  category: string;
  source_name: string;
}) {
  if (isAdsenseHiddenCategory(article.category)) {
    return true;
  }

  const title = article.title.toLowerCase();
  const sourceName = article.source_name.toLowerCase();

  if (sourceName.includes("google trends")) {
    return true;
  }

  if (sourceName.includes("referral")) {
    return true;
  }

  if (ADSENSE_LOW_VALUE_TITLE_PATTERNS.some((pattern) => title.includes(pattern))) {
    return true;
  }

  return false;
}

export function articleRobotsForAdsense(article: {
  title: string;
  category: string;
  source_name: string;
}) {
  if (shouldHideArticleForAdsense(article)) {
    return {
      index: false,
      follow: true
    } as const;
  }

  return {
    index: true,
    follow: true
  } as const;
}

export const ADSENSE_KEEP_TITLE_PATTERNS = [
  "how to ",
  "how-to",
  "best ",
  "checklist",
  "template",
  " vs ",
  " versus ",
  " explained",
  "best practices",
  "guide for",
  "workflow",
  "formula"
] as const;

export const ADSENSE_MONETIZATION_TITLE_PATTERNS = [
  "adsense",
  "rpm",
  "cpm",
  "monetiz",
  "revenue",
  "publisher",
  "newsletter",
  "affiliate",
  "utm"
] as const;

export const ADSENSE_DERIVATIVE_TITLE_PATTERNS = [
  "navigating the ",
  "implications of ",
  "understanding the implications",
  "harnessing ",
  "leveraging ",
  "unlocking ",
  "exploring the ",
  "analyzing ",
  "strategic insights",
  " secures ",
  "funding round",
  "valuation surge",
  "referral link"
] as const;

export function getAdsenseTargetPublishedCount() {
  return Number(process.env.ADSENSE_TARGET_PUBLISHED_COUNT ?? 100);
}

export type AdsenseArticleCorpusInput = {
  id: string;
  title: string;
  slug: string;
  category: string;
  source_name: string;
  source_url?: string | null;
  image_url?: string | null;
  content?: string | null;
  published_at?: string | null;
};

export function scoreArticleForAdsenseRetention(
  article: Omit<AdsenseArticleCorpusInput, "id">
) {
  if (shouldHideArticleForAdsense(article)) {
    return -10_000;
  }

  let score = 0;
  const title = article.title.toLowerCase();
  const sourceUrl = (article.source_url ?? "").toLowerCase();

  if (sourceUrl.startsWith("editorial://")) {
    score += 80;
  }

  if (OWNER_VOICE_SKIP_SLUGS.includes(article.slug)) {
    score += 50;
  }

  if (ADSENSE_KEEP_TITLE_PATTERNS.some((pattern) => title.includes(pattern))) {
    score += 25;
  }

  if (
    ADSENSE_MONETIZATION_TITLE_PATTERNS.some((pattern) => title.includes(pattern))
  ) {
    score += 20;
  }

  if (
    ADSENSE_DERIVATIVE_TITLE_PATTERNS.some((pattern) => title.includes(pattern))
  ) {
    score -= 15;
  }

  if (title.startsWith("i would not")) {
    score -= 40;
  }

  if (article.image_url?.trim()) {
    score += 5;
  }

  const contentLength = (article.content ?? "").length;
  if (contentLength > 4000) {
    score += 10;
  } else if (contentLength > 0 && contentLength < 1500) {
    score -= 10;
  }

  if (
    article.category === "creator-business" ||
    article.category === "seo" ||
    article.category === "digital-marketing"
  ) {
    score += 5;
  }

  return score;
}

export function pickArticlesToDraftForAdsenseCorpus(
  articles: AdsenseArticleCorpusInput[],
  targetCount = getAdsenseTargetPublishedCount()
) {
  const mustDraft = articles.filter((article) =>
    shouldHideArticleForAdsense(article)
  );
  const mustDraftIds = new Set(mustDraft.map((article) => article.id));
  const survivors = articles.filter((article) => !mustDraftIds.has(article.id));
  const capDraftCount = Math.max(0, survivors.length - targetCount);

  const rankedForRemoval = survivors
    .map((article) => ({
      article,
      score: scoreArticleForAdsenseRetention(article)
    }))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      return (left.article.published_at ?? "").localeCompare(
        right.article.published_at ?? ""
      );
    });

  const capDraft = rankedForRemoval
    .slice(0, capDraftCount)
    .map((entry) => entry.article);
  const capDraftIds = new Set(capDraft.map((article) => article.id));
  const keep = survivors.filter((article) => !capDraftIds.has(article.id));

  return {
    mustDraft,
    capDraft,
    keep,
    allToDraft: [...mustDraft, ...capDraft],
    targetCount,
    publishedAfter: keep.length
  };
}
