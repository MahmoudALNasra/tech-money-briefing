import { CORE_CATEGORIES, type CoreCategory } from "./categories";

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

export const ADSENSE_TRUST_PAGES = [
  "/about",
  "/contact",
  "/editorial-policy",
  "/privacy",
  "/terms",
  "/advertise"
] as const;

export function isAdsenseReviewMode() {
  return process.env.ADSENSE_REVIEW_MODE === "true";
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

  const isTrendLike =
    isAdsenseHiddenCategory(article.category) || sourceName.includes("google trends");

  if (!isTrendLike) {
    return false;
  }

  return TREND_NOISE_TITLE_PATTERNS.some((pattern) => title.includes(pattern));
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
