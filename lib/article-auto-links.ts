import { COMPARISONS } from "@/lib/comparisons";
import { FREE_TOOLS } from "@/lib/free-tools";
import { getStaticInternalLinksForText } from "@/lib/internal-links";
import { searchPublishedArticles } from "@/lib/articles";
import type { Article } from "@/lib/types";

export type AutoLinkRule = {
  href: string;
  pattern: RegExp;
  priority: number;
};

export type ArticleAutoLinkBudget = {
  hrefCounts: Map<string, number>;
  total: number;
  maxPerHref: number;
  maxTotal: number;
};

export const DEFAULT_AUTO_LINK_BUDGET: ArticleAutoLinkBudget = {
  hrefCounts: new Map(),
  total: 0,
  maxPerHref: 2,
  maxTotal: 14
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phrasePattern(phrase: string) {
  return new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
}

function internalPriority(href: string) {
  return href.startsWith("/") ? 3 : 1;
}

function addRule(
  rules: AutoLinkRule[],
  seen: Set<string>,
  href: string,
  phrases: string[],
  priority?: number
) {
  const rulePriority = priority ?? internalPriority(href);

  for (const phrase of phrases) {
    const trimmed = phrase.trim();

    if (trimmed.length < 3) {
      continue;
    }

    const key = `${href}::${trimmed.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    rules.push({
      href,
      pattern: phrasePattern(trimmed),
      priority: rulePriority
    });
  }
}

const TOOL_EXTRA_PHRASES: Record<string, string[]> = {
  "/leads": [
    "business data generator",
    "local lead list",
    "lead generator",
    "local business data",
    "B2B lead list"
  ],
  "/meme-generator": ["meme generator", "meme maker"],
  "/image-compressor": ["image compressor", "compress images", "WebP converter"],
  "/youtube-thumbnail-maker": ["YouTube thumbnail maker", "thumbnail maker"],
  "/x-card-generator": [
    "X card generator",
    "Twitter card generator",
    "social card preview"
  ],
  "/startup-name-generator": ["startup name generator", "SaaS name ideas"],
  "/cpm-rpm-calculator": ["CPM calculator", "RPM calculator", "CPM and RPM"],
  "/newsletter-subject-line-generator": [
    "newsletter subject line generator",
    "email subject lines"
  ],
  "/ai-headline-generator": ["AI headline generator", "headline generator"],
  "/adsense-revenue-calculator": ["AdSense revenue calculator", "AdSense revenue"],
  "/youtube-title-generator": ["YouTube title generator"],
  "/tiktok-hook-generator": ["TikTok hook generator", "video hook generator"],
  "/blog-title-generator": ["blog title generator"],
  "/meta-description-generator": ["meta description generator"],
  "/utm-builder": ["UTM builder", "UTM link builder", "UTM parameters"],
  "/robots-txt-generator": ["robots.txt generator", "robots txt generator"],
  "/newsletter-revenue-calculator": ["newsletter revenue calculator"],
  "/adsense-ctr-calculator": ["AdSense CTR calculator", "CTR calculator"],
  "/saas-pricing-calculator": ["SaaS pricing calculator", "MRR calculator"],
  "/roas-calculator": ["ROAS calculator", "return on ad spend"],
  "/cac-payback-calculator": ["CAC payback calculator", "CAC payback period"],
  "/content-brief-generator": ["content brief generator", "SEO content brief"],
  "/faq-generator": ["FAQ generator"],
  "/linkedin-post-generator": ["LinkedIn post generator"],
  "/keyword-cluster-tool": ["keyword cluster tool", "keyword clustering"],
  "/serp-intent-analyzer": ["SERP intent analyzer", "search intent analyzer"],
  "/content-gap-finder": ["content gap finder", "content gap analysis"]
};

const HUB_PHRASES: Array<{ href: string; phrases: string[] }> = [
  {
    href: "/tools",
    phrases: ["free tools", "publisher tools", "marketing calculators"]
  },
  {
    href: "/compare",
    phrases: ["software comparison", "tool comparison", "compare platforms"]
  },
  {
    href: "/monetization-checklist",
    phrases: ["monetization checklist", "revenue checklist"]
  },
  {
    href: "/monetization-audit",
    phrases: ["monetization audit", "revenue audit"]
  },
  {
    href: "/content-gap-finder",
    phrases: ["competitor content gaps", "content gaps vs competitors"]
  }
];

const EXTERNAL_PHRASES: Array<{ href: string; phrases: string[] }> = [
  { href: "https://chatgpt.com/", phrases: ["ChatGPT"] },
  { href: "https://claude.ai/", phrases: ["Claude"] },
  { href: "https://gemini.google.com/", phrases: ["Gemini"] },
  { href: "https://www.perplexity.ai/", phrases: ["Perplexity"] },
  { href: "https://www.midjourney.com/", phrases: ["Midjourney"] },
  { href: "https://cursor.com/", phrases: ["Cursor"] },
  { href: "https://github.com/features/copilot", phrases: ["GitHub Copilot"] },
  { href: "https://analytics.google.com/", phrases: ["Google Analytics", "GA4"] },
  {
    href: "https://search.google.com/search-console",
    phrases: ["Google Search Console", "Search Console"]
  },
  {
    href: "https://www.google.com/business/",
    phrases: ["Google Business Profile"]
  },
  {
    href: "https://pagespeed.web.dev/",
    phrases: ["PageSpeed Insights", "Lighthouse"]
  },
  { href: "https://www.notion.com/product/ai", phrases: ["Notion AI"] },
  { href: "https://supabase.com/", phrases: ["Supabase"] },
  { href: "https://www.shopify.com/", phrases: ["Shopify"] },
  { href: "https://woocommerce.com/", phrases: ["WooCommerce"] },
  { href: "https://substack.com/", phrases: ["Substack"] },
  { href: "https://www.beehiiv.com/", phrases: ["Beehiiv"] },
  { href: "https://ahrefs.com/", phrases: ["Ahrefs"] },
  { href: "https://moz.com/", phrases: ["Moz"] },
  { href: "https://www.semrush.com/", phrases: ["Semrush"] },
  { href: "https://stripe.com/", phrases: ["Stripe"] },
  { href: "https://www.paddle.com/", phrases: ["Paddle"] },
  { href: "https://mailchimp.com/", phrases: ["Mailchimp"] },
  { href: "https://www.hubspot.com/", phrases: ["HubSpot"] }
];

function buildToolRules(seen: Set<string>) {
  const rules: AutoLinkRule[] = [];

  for (const tool of FREE_TOOLS) {
    const phrases = [
      tool.title,
      ...(TOOL_EXTRA_PHRASES[tool.href] ?? [])
    ];

    addRule(rules, seen, tool.href, phrases, 3);
  }

  return rules;
}

function buildComparisonRules(seen: Set<string>) {
  const rules: AutoLinkRule[] = [];

  for (const comparison of COMPARISONS) {
    const href = `/compare/${comparison.slug}`;
    const phrases = [
      comparison.title,
      `${comparison.productA} vs ${comparison.productB}`,
      `${comparison.productA} versus ${comparison.productB}`,
      ...comparison.keywords
    ];

    addRule(rules, seen, href, phrases, 3);

    if (comparison.productA.length >= 5) {
      addRule(rules, seen, href, [comparison.productA], 2);
    }

    if (comparison.productB.length >= 5) {
      addRule(rules, seen, href, [comparison.productB], 2);
    }
  }

  return rules;
}

function buildHubRules(seen: Set<string>) {
  const rules: AutoLinkRule[] = [];

  for (const hub of HUB_PHRASES) {
    addRule(rules, seen, hub.href, hub.phrases, 2);
  }

  return rules;
}

function buildExternalRules(seen: Set<string>) {
  const rules: AutoLinkRule[] = [];

  for (const entry of EXTERNAL_PHRASES) {
    addRule(rules, seen, entry.href, entry.phrases, 1);
  }

  return rules;
}

function sortAutoLinkRules(rules: AutoLinkRule[]) {
  return [...rules].sort((left, right) => {
    const leftSource = left.pattern.source.length;
    const rightSource = right.pattern.source.length;

    if (rightSource !== leftSource) {
      return rightSource - leftSource;
    }

    return right.priority - left.priority;
  });
}

let cachedBaseRules: AutoLinkRule[] | null = null;

export function getBaseAutoLinkRules() {
  if (cachedBaseRules) {
    return cachedBaseRules;
  }

  const seen = new Set<string>();
  cachedBaseRules = sortAutoLinkRules([
    ...buildComparisonRules(seen),
    ...buildToolRules(seen),
    ...buildHubRules(seen),
    ...buildExternalRules(seen)
  ]);

  return cachedBaseRules;
}

function searchTermsFromTitle(title: string) {
  const stopWords = new Set([
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
    "how",
    "why",
    "guide",
    "best"
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return [...new Set(words)].slice(0, 4).join(" ");
}

function contextualPhrasesFromLabel(label: string) {
  const cleaned = label
    .replace(/\s*[|\-–—]\s*.+$/u, "")
    .replace(/\b(20\d{2}|guide|how to)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 18 || cleaned.length > 72) {
    return [];
  }

  return [cleaned];
}

export async function buildAutoLinkRulesForArticle(article: Article) {
  const haystack = [
    article.title,
    article.meta_description,
    article.category,
    article.key_takeaways.join(" "),
    article.content.slice(0, 4000)
  ].join(" ");

  const seen = new Set<string>();
  const contextualRules: AutoLinkRule[] = [];

  for (const item of getStaticInternalLinksForText(haystack, 8)) {
    addRule(contextualRules, seen, item.href, contextualPhrasesFromLabel(item.label), 4);

    if (item.type === "comparison") {
      addRule(contextualRules, seen, item.href, [item.label], 4);
    }
  }

  const query = searchTermsFromTitle(article.title);

  if (query) {
    const relatedArticles = await searchPublishedArticles(query, 5);

    for (const related of relatedArticles) {
      if (related.id === article.id) {
        continue;
      }

      const href = `/${related.category}/${related.slug}`;
      addRule(
        contextualRules,
        seen,
        href,
        contextualPhrasesFromLabel(related.title),
        4
      );
    }
  }

  const baseRules = getBaseAutoLinkRules();

  return sortAutoLinkRules([...contextualRules, ...baseRules]);
}

export function canUseAutoLink(budget: ArticleAutoLinkBudget, href: string) {
  if (budget.total >= budget.maxTotal) {
    return false;
  }

  const count = budget.hrefCounts.get(href) ?? 0;

  return count < budget.maxPerHref;
}

export function recordAutoLink(budget: ArticleAutoLinkBudget, href: string) {
  budget.total += 1;
  budget.hrefCounts.set(href, (budget.hrefCounts.get(href) ?? 0) + 1);
}
