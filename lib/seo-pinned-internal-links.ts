import {
  getComparisonBySlug,
  type ComparisonPage
} from "@/lib/comparisons";
import type { InternalLinkItem } from "@/lib/internal-links";

function comparisonLink(slug: string): InternalLinkItem | null {
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    return null;
  }

  return {
    href: `/compare/${comparison.slug}`,
    label: comparison.seoTitle ?? comparison.title,
    description: comparison.description,
    type: "comparison"
  };
}

function hubLink(
  href: string,
  label: string,
  description: string,
  type: InternalLinkItem["type"] = "hub"
): InternalLinkItem {
  return { href, label, description, type };
}

const PINNED_BY_ARTICLE_SLUG: Record<string, InternalLinkItem[]> = {
  "best-cursor-prompts-for-coding-examples-that-actually-help": [
    comparisonLink("cursor-vs-github-copilot")
  ].filter((item): item is InternalLinkItem => item !== null),
  "how-to-use-cursor-ai-for-beginners-setup-prompts-and-workflow": [
    comparisonLink("cursor-vs-github-copilot")
  ].filter((item): item is InternalLinkItem => item !== null),
  "github-copilot-vs-cursor-which-fits-your-team": [
    comparisonLink("cursor-vs-github-copilot")
  ].filter((item): item is InternalLinkItem => item !== null),
  "cursor-composer-vs-chat-which-one-should-you-use": [
    comparisonLink("cursor-vs-github-copilot")
  ].filter((item): item is InternalLinkItem => item !== null),
  "how-to-use-cursor-for-coding-a-practical-setup-guide": [
    comparisonLink("cursor-vs-github-copilot")
  ].filter((item): item is InternalLinkItem => item !== null),
  "understanding-cloudflare-s-agent-readiness-score-implications-for-seo-professionals":
    [
      comparisonLink("cloudflare-vs-aws-cloudfront"),
      comparisonLink("vercel-vs-netlify")
    ].filter((item): item is InternalLinkItem => item !== null),
  "leveraging-google-s-lighthouse-for-enhanced-website-performance-and-seo": [
    comparisonLink("cloudflare-vs-aws-cloudfront"),
    hubLink(
      "/image-compressor",
      "Free image compressor",
      "Shrink hero and article images before testing Core Web Vitals.",
      "tool"
    )
  ].filter((item): item is InternalLinkItem => item !== null),
  "google-analytics-data-delay-why-reports-lag-and-what-ga4-does-not-track": [
    comparisonLink("matomo-vs-google-analytics"),
    comparisonLink("google-analytics-vs-plausible")
  ].filter((item): item is InternalLinkItem => item !== null),
  "strategic-implications-of-snowflake-s-6b-partnership-with-aws-for-ai-tools": [
    comparisonLink("snowflake-vs-bigquery"),
    comparisonLink("supabase-vs-aws")
  ].filter((item): item is InternalLinkItem => item !== null),
  "best-ai-tools-for-solo-founders-in-2026-stack-not-hype": [
    comparisonLink("cursor-vs-github-copilot"),
    hubLink(
      "/tools",
      "Browse free tools",
      "Calculators and generators for solo founders shipping revenue pages.",
      "hub"
    ),
    hubLink(
      "/leads",
      "Local lead generator",
      "Preview local businesses and outreach angles for solo outbound.",
      "tool"
    )
  ].filter((item): item is InternalLinkItem => item !== null)
};

export function getPinnedInternalLinksForArticle(slug: string) {
  return PINNED_BY_ARTICLE_SLUG[slug] ?? [];
}

export function mergeInternalLinks(
  pinned: InternalLinkItem[],
  discovered: InternalLinkItem[],
  limit = 6
) {
  const seen = new Set<string>();
  const merged: InternalLinkItem[] = [];

  for (const item of [...pinned, ...discovered]) {
    if (seen.has(item.href)) {
      continue;
    }

    seen.add(item.href);
    merged.push(item);

    if (merged.length >= limit) {
      break;
    }
  }

  return merged;
}

export function getRelatedComparisonLinks(slugs: string[] | undefined) {
  if (!slugs?.length) {
    return [] as ComparisonPage[];
  }

  return slugs
    .map((slug) => getComparisonBySlug(slug))
    .filter((comparison): comparison is ComparisonPage => comparison !== null);
}
