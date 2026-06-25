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

export function getAdsenseReviewRobotsDisallow() {
  if (!isAdsenseReviewMode()) {
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
  if (!isAdsenseReviewMode()) {
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
