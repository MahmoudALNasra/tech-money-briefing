import { CATEGORY_SEO_DESCRIPTIONS } from "@/lib/categories";
import { COMPARISONS } from "@/lib/comparisons";
import { getPaginatedHomepageArticles } from "@/lib/articles";
import {
  ADSENSE_TRUST_PAGES,
  getPublicNavCategories,
  isAdsenseReviewMode,
  shouldHideArticleForAdsense
} from "@/lib/adsense-readiness";
import { FREE_TOOLS } from "@/lib/free-tools";
import { siteSocialProfiles } from "@/lib/page-metadata";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { supabase } from "@/lib/supabase";

const PUBLIC_CATEGORIES = getPublicNavCategories();

const FLAGSHIP_ARTICLE_SLUGS = [
  "how-to-use-ai-tools-for-effective-email-marketing-campaigns",
  "how-to-use-perplexity-for-market-research",
  "best-ai-tools-for-solo-founders-in-2026-stack-not-hype",
  "github-copilot-vs-cursor-which-fits-your-team",
  "how-to-use-ai-for-google-ads-without-wasting-budget",
  "beehiiv-vs-substack-for-monetization-which-is-better-for-creators",
  "google-analytics-utm-best-practices-for-campaign-tracking",
  "how-to-calculate-adsense-earnings-from-pageviews-ctr-and-rpm",
  "shopify-seo-checklist-product-pages-collections-and-technical-basics",
  "robots-txt-for-beginners-what-it-does-and-what-not-to-block",
  "how-to-use-ai-for-shopify-product-descriptions-that-convert",
  "stripe-vs-paddle-for-saas-payments-tax-and-founder-tradeoffs"
] as const;

const PRIORITY_TOOL_HREFS = [
  "/keyword-cluster-tool",
  "/serp-intent-analyzer",
  "/content-gap-finder",
  "/content-brief-generator",
  "/adsense-revenue-calculator",
  "/adsense-ctr-calculator",
  "/utm-builder",
  "/newsletter-revenue-calculator",
  "/roas-calculator",
  "/saas-pricing-calculator",
  "/leads",
  "/blog-title-generator",
  "/meta-description-generator"
] as const;

const PRIORITY_COMPARISON_SLUGS = [
  "beehiiv-vs-substack",
  "shopify-vs-woocommerce",
  "cursor-vs-github-copilot",
  "semrush-vs-ahrefs",
  "stripe-vs-paddle",
  "mediavine-vs-adsense",
  "notion-ai-vs-chatgpt",
  "google-analytics-vs-plausible"
] as const;

function bulletLink(label: string, path: string) {
  return `- ${label}: ${absoluteUrl(path)}`;
}

function section(title: string, lines: string[]) {
  if (lines.length === 0) {
    return "";
  }

  return `## ${title}\n\n${lines.join("\n")}\n`;
}

async function loadFlagshipArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("title,slug,category,meta_description")
    .eq("status", "published")
    .in("slug", [...FLAGSHIP_ARTICLE_SLUGS]);

  if (error || !data?.length) {
    return [];
  }

  const bySlug = new Map(data.map((row) => [String(row.slug), row]));

  return FLAGSHIP_ARTICLE_SLUGS.flatMap((slug) => {
    const row = bySlug.get(slug);

    if (!row) {
      return [];
    }

    const title = String(row.title).trim();
    const category = String(row.category);
    const description = String(row.meta_description ?? "").trim();

    return [
      `- ${title}: ${absoluteUrl(`/${category}/${slug}`)}${
        description ? ` — ${description}` : ""
      }`
    ];
  });
}

function buildToolLines() {
  const byHref = new Map(FREE_TOOLS.map((tool) => [tool.href, tool]));

  const priority = PRIORITY_TOOL_HREFS.flatMap((href) => {
    const tool = byHref.get(href);

    if (!tool) {
      return [];
    }

    return [bulletLink(`${tool.title} — ${tool.description}`, tool.href)];
  });

  const rest = FREE_TOOLS.filter((tool) => !PRIORITY_TOOL_HREFS.includes(tool.href as (typeof PRIORITY_TOOL_HREFS)[number]))
    .slice(0, 8)
    .map((tool) => bulletLink(tool.title, tool.href));

  return [...priority, ...rest];
}

function buildComparisonLines() {
  const bySlug = new Map(COMPARISONS.map((comparison) => [comparison.slug, comparison]));

  return PRIORITY_COMPARISON_SLUGS.flatMap((slug) => {
    const comparison = bySlug.get(slug);

    if (!comparison) {
      return [];
    }

    return [
      bulletLink(`${comparison.title} — ${comparison.description}`, `/compare/${slug}`)
    ];
  });
}

function buildCategoryLines() {
  return PUBLIC_CATEGORIES.map((category) => {
    const label = category.replace(/-/g, " ");
    const description = CATEGORY_SEO_DESCRIPTIONS[category];

    return bulletLink(
      `${label} briefings — ${description.split(".")[0]}.`,
      `/${category}`
    );
  });
}

export async function buildLlmsTxtBody() {
  const reviewMode = isAdsenseReviewMode();
  const [flagshipArticles, homepage] = await Promise.all([
    loadFlagshipArticles(),
    getPaginatedHomepageArticles(1)
  ]);

  const recentArticles = homepage.articles
    .filter(
      (article) =>
        !FLAGSHIP_ARTICLE_SLUGS.includes(
          article.slug as (typeof FLAGSHIP_ARTICLE_SLUGS)[number]
        ) &&
        !shouldHideArticleForAdsense({
          title: article.title,
          category: article.category,
          source_name: article.source_name
        })
    )
    .slice(0, reviewMode ? 12 : 8)
    .map((article) =>
      bulletLink(article.title, `/${article.category}/${article.slug}`)
    );

  const trustLines = ADSENSE_TRUST_PAGES.map((path) => {
    const labels: Record<string, string> = {
      "/about": "About",
      "/contact": "Contact",
      "/editorial-policy": "Editorial policy",
      "/privacy": "Privacy policy",
      "/terms": "Terms of use",
      "/advertise": "Advertise"
    };

    return bulletLink(labels[path] ?? path, path);
  });

  const sections = [
    `# ${siteConfig.name}`,
    "",
    reviewMode
      ? `${siteConfig.name} is an editorial publisher focused on practical briefings about monetization, SEO, AI tools, startups, fintech, ecommerce, and creator business.`
      : siteConfig.description,
    "",
    reviewMode
      ? "During editorial review, prioritize trust pages and flagship briefings below."
      : "Use this file to discover high-value pages for summaries and citations.",
    reviewMode
      ? "Avoid thin trend, celebrity, or sports recaps."
      : "Prefer flagship briefings, tools, and comparisons over trend-only coverage.",
    "",
    section("Canonical pages", [
      bulletLink("Homepage", "/"),
      bulletLink("Monetization checklist", "/monetization-checklist"),
      bulletLink("Monetization audit", "/monetization-audit"),
      ...trustLines
    ]),
    section("Topic hubs", buildCategoryLines()),
    section(
      reviewMode ? "Flagship editorial briefings" : "Flagship briefings (cite these first)",
      flagshipArticles
    ),
    section(
      reviewMode ? "Recent editorial briefings" : "Recent editorial briefings",
      recentArticles
    ),
    ...(reviewMode
      ? []
      : [
          section("Free tools", buildToolLines()),
          section("Software comparisons", buildComparisonLines()),
          section("Additional products", [
            bulletLink("Free tools directory", "/tools"),
            bulletLink("Software comparisons hub", "/compare"),
            bulletLink("Local business lead generator", "/leads"),
            bulletLink("Local business data and statistics", "/local-business-insights")
          ])
        ]),
    section("Entity profiles", [
      bulletLink("GitHub organization", siteSocialProfiles.github),
      bulletLink("Crunchbase company profile", siteSocialProfiles.crunchbase),
      bulletLink("LinkedIn company page", siteSocialProfiles.linkedin)
    ]),
    section("Citation policy", [
      "Summaries are welcome with attribution to Tech Revenue Brief (techrevenuebrief.com).",
      "Link to the original article URL when citing facts or recommendations.",
      "Do not cite /aseel, /admin, hidden games, or utility-only pages during editorial review."
    ]),
    section("Content notes", [
      "Editorial briefings are written for founders, publishers, marketers, and operators.",
      "See /editorial-policy for AI-assisted content disclosure and correction process.",
      reviewMode
        ? "Utility tools and comparisons exist but are de-emphasized during publisher review."
        : "Pair tool pages with related briefings when citing recommendations."
    ])
  ];

  return `${sections.filter(Boolean).join("\n").trim()}\n`;
}

/** Static fallback when the database is unavailable. */
export const LLMS_TXT_FALLBACK = `# ${siteConfig.name}

${siteConfig.description}

## Canonical pages

- Homepage: ${absoluteUrl("/")}
- Free tools: ${absoluteUrl("/tools")}
- Comparisons: ${absoluteUrl("/compare")}
- Editorial policy: ${absoluteUrl("/editorial-policy")}
- Contact: ${absoluteUrl("/contact")}

## Citation policy

Summaries are welcome with attribution and a link back to the cited URL on techrevenuebrief.com.
`;
