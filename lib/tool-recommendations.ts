import { FREE_TOOLS } from "./free-tools";

export type RecommendedTool = {
  href: string;
  title: string;
  description: string;
};

type ToolRule = {
  href: string;
  keywords: string[];
};

const TOOL_RULES: ToolRule[] = [
  {
    href: "/ai-headline-generator",
    keywords: ["ai", "chatgpt", "claude", "gpt", "llm", "automation", "copilot"]
  },
  {
    href: "/youtube-title-generator",
    keywords: ["youtube", "video", "creator", "shorts", "thumbnail", "channel"]
  },
  {
    href: "/youtube-thumbnail-maker",
    keywords: ["youtube", "thumbnail", "video", "creator"]
  },
  {
    href: "/tiktok-hook-generator",
    keywords: ["tiktok", "reels", "short form", "shorts", "hook", "viral"]
  },
  {
    href: "/blog-title-generator",
    keywords: ["blog", "content", "publisher", "article", "writing", "seo"]
  },
  {
    href: "/meta-description-generator",
    keywords: ["seo", "search", "meta", "serp", "google", "ranking", "organic"]
  },
  {
    href: "/utm-builder",
    keywords: ["marketing", "campaign", "ads", "traffic", "analytics", "attribution"]
  },
  {
    href: "/robots-txt-generator",
    keywords: ["seo", "crawl", "index", "robots", "sitemap", "search console"]
  },
  {
    href: "/newsletter-subject-line-generator",
    keywords: ["newsletter", "email", "substack", "beehiiv", "convertkit", "mail"]
  },
  {
    href: "/newsletter-revenue-calculator",
    keywords: ["newsletter", "email", "subscriber", "creator", "monetization"]
  },
  {
    href: "/adsense-revenue-calculator",
    keywords: ["adsense", "ad revenue", "rpm", "cpm", "display ads", "publisher"]
  },
  {
    href: "/adsense-ctr-calculator",
    keywords: ["adsense", "ctr", "clicks", "display ads", "monetization"]
  },
  {
    href: "/cpm-rpm-calculator",
    keywords: ["cpm", "rpm", "ads", "monetization", "traffic", "revenue"]
  },
  {
    href: "/saas-pricing-calculator",
    keywords: ["saas", "startup", "pricing", "mrr", "arr", "subscription"]
  },
  {
    href: "/startup-name-generator",
    keywords: ["startup", "founder", "launch", "brand", "saas", "app"]
  },
  {
    href: "/x-card-generator",
    keywords: ["twitter", "x.com", "social", "post", "card", "preview"]
  },
  {
    href: "/meme-generator",
    keywords: ["meme", "viral", "social", "humor", "culture", "trend"]
  },
  {
    href: "/image-compressor",
    keywords: ["image", "photo", "compress", "webp", "png", "performance"]
  },
  {
    href: "/youtube-title-generator",
    keywords: ["sports", "nfl", "nba", "mlb", "soccer", "football", "game", "score"]
  },
  {
    href: "/tiktok-hook-generator",
    keywords: ["sports", "celebrity", "entertainment", "random", "viral", "breaking news"]
  },
  {
    href: "/meme-generator",
    keywords: ["sports", "celebrity", "entertainment", "random", "viral", "culture"]
  },
  {
    href: "/x-card-generator",
    keywords: ["breaking", "news", "trend", "sports", "celebrity", "recap"]
  }
];

const toolTitleByHref = new Map(FREE_TOOLS.map((tool) => [tool.href, tool.title]));
const toolDescriptionByHref = new Map(
  FREE_TOOLS.map((tool) => [tool.href, tool.description])
);
const FALLBACK_TOOL_HREFS = [
  "/blog-title-generator",
  "/youtube-title-generator",
  "/tiktok-hook-generator",
  "/meme-generator"
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function scoreRule(text: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => {
    if (!keyword) {
      return score;
    }

    return text.includes(keyword) ? score + keyword.split(/\s+/).length : score;
  }, 0);
}

export function getRecommendedToolsForTrend(
  trendTitle: string,
  newsTitles: string[] = [],
  limit = 4
): RecommendedTool[] {
  return getRecommendedToolsForText(
    [trendTitle, ...newsTitles].join(" "),
    limit,
    true
  );
}

export function getRecommendedToolsForText(
  text: string,
  limit = 4,
  includeFallback = false
): RecommendedTool[] {
  const haystack = normalizeText(text);
  const ranked = TOOL_RULES.map((rule) => ({
    href: rule.href,
    score: scoreRule(haystack, rule.keywords.map(normalizeText))
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const seen = new Set<string>();
  const recommendations: RecommendedTool[] = [];

  for (const entry of ranked) {
    if (seen.has(entry.href) || recommendations.length >= limit) {
      continue;
    }

    seen.add(entry.href);
    recommendations.push({
      href: entry.href,
      title: toolTitleByHref.get(entry.href) ?? entry.href,
      description: toolDescriptionByHref.get(entry.href) ?? "Open this free tool."
    });
  }

  if (includeFallback && recommendations.length < limit) {
    for (const href of FALLBACK_TOOL_HREFS) {
      if (seen.has(href) || recommendations.length >= limit) {
        continue;
      }

      seen.add(href);
      recommendations.push({
        href,
        title: toolTitleByHref.get(href) ?? href,
        description: toolDescriptionByHref.get(href) ?? "Open this free tool."
      });
    }
  }

  return recommendations;
}

export function formatToolRecommendationsMarkdown(
  tools: RecommendedTool[],
  siteOrigin = "https://techrevenuebrief.com"
) {
  if (tools.length === 0) {
    return "";
  }

  const lines = tools.map(
    (tool) =>
      `- [${tool.title}](${siteOrigin}${tool.href})`
  );

  return `## Useful tools for this trend\n\n${lines.join("\n")}`;
}
