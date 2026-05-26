import OpenAI from "openai";
import Parser from "rss-parser";

import { fetchOpenGraphImage } from "./ingestion";
import { generateShareId } from "./share-id";
import { slugify } from "./slug";
import { supabase } from "./supabase";
import {
  formatToolRecommendationsMarkdown,
  getRecommendedToolsForTrend
} from "./tool-recommendations";

type TrendArticle = {
  title: string;
  content: string;
  meta_description: string;
  key_takeaways: string[];
};

type TrendSeed = {
  title: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string | null;
  traffic?: string;
  publishedAt?: string;
  newsTitles: string[];
  newsSnippets: string[];
  rank?: number;
  articleKeys?: Array<[number, string, string]>;
};

type TrendsIngestionOptions = {
  maxNewArticles?: number;
  maxTrends?: number;
  geo?: string;
};

const TREND_CATEGORY = "others";
const GOOGLE_TRENDS_SOURCE = "Google Trends";
const BROAD_TREND_LIMIT = 5;
const CATEGORY_TREND_LIMIT = 5;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "ai-tools": ["ai", "chatgpt", "claude", "gpt", "llm", "openai", "copilot", "gemini"],
  "digital-marketing": [
    "marketing",
    "ads",
    "campaign",
    "facebook",
    "instagram",
    "tiktok",
    "attribution"
  ],
  seo: ["seo", "search", "google", "ranking", "serp", "keyword", "backlink"],
  ecommerce: ["shopify", "amazon", "store", "ecommerce", "retail", "checkout", "product"],
  startups: ["startup", "founder", "funding", "venture", "saas", "launch", "yc"],
  fintech: ["fintech", "bank", "payments", "stripe", "crypto", "lending", "wallet"],
  "creator-business": [
    "creator",
    "newsletter",
    "youtube",
    "podcast",
    "substack",
    "influencer",
    "content"
  ]
};

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["ht:approx_traffic", "approxTraffic"],
      ["ht:picture", "picture"],
      ["ht:picture_source", "pictureSource"],
      ["ht:news_item", "newsItems", { keepArray: true }]
    ]
  },
  headers: {
    "User-Agent":
      "TechRevenueBrief/1.0 (+https://techrevenuebrief.com; trends ingestion)"
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function runTrendsIngestion(options: TrendsIngestionOptions = {}) {
  const maxNewArticles =
    options.maxNewArticles ??
    Number(process.env.TRENDS_MAX_NEW_ARTICLES ?? 10);
  const maxTrends = options.maxTrends ?? 40;
  const geo = options.geo ?? process.env.GOOGLE_TRENDS_GEO ?? "US";
  const feedUrl =
    process.env.GOOGLE_TRENDS_RSS_URL ??
    `https://trends.google.com/trending/rss?geo=${encodeURIComponent(
      geo
    )}`;

  const sourceSeeds = await loadRankedTrendSeeds({
    feedUrl,
    geo,
    maxTrends
  });
  const seeds = selectTrendSeeds(sourceSeeds);
  const result = {
    ok: true,
    source: GOOGLE_TRENDS_SOURCE,
    geo,
    maxNewArticles,
    selected: seeds.map((seed) => ({
      rank: seed.rank,
      title: seed.title,
      traffic: seed.traffic,
      source: seed.sourceName
    })),
    processed: 0,
    inserted: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const seed of seeds) {
    if (result.inserted >= maxNewArticles) {
      break;
    }

    result.processed += 1;

    if (!seed.title || !seed.sourceUrl) {
      result.skipped += 1;
      continue;
    }

    const hydratedSeed = await hydrateTrendSeed(seed);

    if (await articleExists(hydratedSeed.sourceUrl)) {
      result.skipped += 1;
      continue;
    }

    try {
      const article = await writeTrendArticle(hydratedSeed);
      const slug = await createUniqueSlug(article.title);
      const shareId = await createUniqueShareId();
      const sourceImageUrl = await fetchOpenGraphImage(hydratedSeed.sourceUrl);
      const imageUrl = sourceImageUrl ?? hydratedSeed.imageUrl;
      const status = imageUrl ? "published" : "draft";

      const { error } = await supabase.from("articles").insert({
        title: article.title,
        slug,
        content: article.content,
        meta_description: article.meta_description,
        key_takeaways: article.key_takeaways,
        category: TREND_CATEGORY,
        source_name:
          hydratedSeed.sourceName === GOOGLE_TRENDS_SOURCE
            ? GOOGLE_TRENDS_SOURCE
            : `${GOOGLE_TRENDS_SOURCE} / ${hydratedSeed.sourceName}`,
        source_url: hydratedSeed.sourceUrl,
        image_url: imageUrl,
        share_id: shareId,
        status,
        published_at: hydratedSeed.publishedAt ?? new Date().toISOString()
      });

      if (error) {
        if (error.code === "23505") {
          result.skipped += 1;
          continue;
        }

        throw error;
      }

      result.inserted += 1;
    } catch (error) {
      result.errors.push(
        `${hydratedSeed.title}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
}

async function loadRankedTrendSeeds({
  feedUrl,
  geo,
  maxTrends
}: {
  feedUrl: string;
  geo: string;
  maxTrends: number;
}) {
  if (process.env.GOOGLE_TRENDS_SOURCE === "rss") {
    return loadRssTrendSeeds(feedUrl, maxTrends);
  }

  try {
    return await loadTrendingNowSeeds(geo, maxTrends);
  } catch (error) {
    console.warn(
      "[trends] Trending Now source failed, falling back to RSS",
      error
    );
    return loadRssTrendSeeds(feedUrl, maxTrends);
  }
}

async function loadRssTrendSeeds(feedUrl: string, maxTrends: number) {
  const feed = await parser.parseURL(feedUrl);
  return feed.items.slice(0, maxTrends).map(toTrendSeed);
}

async function loadTrendingNowSeeds(geo: string, maxTrends: number) {
  const { trendingNow } = await import("trendsearch");
  const requestedHours = Number(process.env.GOOGLE_TRENDS_HOURS ?? 24);
  const hours =
    requestedHours === 4 ||
    requestedHours === 24 ||
    requestedHours === 48 ||
    requestedHours === 168
      ? requestedHours
      : 24;
  const result = await trendingNow({
    geo,
    language: process.env.GOOGLE_TRENDS_LANGUAGE ?? "en",
    hours
  });

  return result.data.items.slice(0, maxTrends).map((item, index) => {
    const relatedKeywords = item.relatedKeywords ?? [];

    return {
      title: item.keyword,
      sourceUrl: buildTrendSearchUrl(item.keyword),
      sourceName: "Google Trends Trending Now",
      imageUrl: null,
      traffic:
        typeof item.traffic === "number"
          ? `${item.traffic.toLocaleString()}+`
          : undefined,
      publishedAt: item.activeTime,
      newsTitles: relatedKeywords.slice(0, 8),
      newsSnippets: relatedKeywords.slice(8, 16),
      rank: index + 1,
      articleKeys: item.articleKeys?.slice(0, 5)
    } satisfies TrendSeed;
  });
}

async function hydrateTrendSeed(seed: TrendSeed): Promise<TrendSeed> {
  if (!seed.articleKeys || seed.articleKeys.length === 0 || seed.imageUrl) {
    return seed;
  }

  try {
    const { trendingArticles } = await import("trendsearch");
    const result = await trendingArticles({
      articleKeys: seed.articleKeys,
      articleCount: 3
    });
    const articles = result.data.articles ?? [];
    const firstArticle = articles.find((article) => article.url);

    return {
      ...seed,
      imageUrl: firstArticle?.image ?? seed.imageUrl,
      newsTitles: [
        ...articles.map((article) => article.title).filter(Boolean),
        ...seed.newsTitles
      ].slice(0, 8),
      newsSnippets: [
        ...articles
          .map((article) =>
            article.source ? `Source context from ${article.source}` : undefined
          )
          .filter(isString),
        ...seed.newsSnippets
      ].slice(0, 8)
    };
  } catch (error) {
    console.warn("[trends] Failed to hydrate trend articles", seed.title, error);
    return seed;
  }
}

function normalizeTrendText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function scoreCategoryRelevance(seed: TrendSeed) {
  const haystack = normalizeTrendText(
    [seed.title, ...seed.newsTitles, ...seed.newsSnippets].join(" ")
  );

  return Object.values(CATEGORY_KEYWORDS).reduce((score, keywords) => {
    const categoryScore = keywords.reduce((inner, keyword) => {
      return haystack.includes(keyword) ? inner + 1 : inner;
    }, 0);

    return score + categoryScore;
  }, 0);
}

function selectTrendSeeds(seeds: TrendSeed[]) {
  const validSeeds = seeds.filter((seed) => seed.title && seed.sourceUrl);
  const broad = validSeeds.slice(0, BROAD_TREND_LIMIT);
  const broadTitles = new Set(broad.map((seed) => seed.title.toLowerCase()));

  const categoryCandidates = validSeeds
    .slice(BROAD_TREND_LIMIT)
    .map((seed) => ({ seed, score: scoreCategoryRelevance(seed) }))
    .filter((entry) => entry.score > 0 && !broadTitles.has(entry.seed.title.toLowerCase()))
    .sort((left, right) => right.score - left.score);

  const category = categoryCandidates
    .slice(0, CATEGORY_TREND_LIMIT)
    .map((entry) => entry.seed);

  const combined = [...broad, ...category];
  const seen = new Set<string>();

  return combined.filter((seed) => {
    const key = seed.title.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function toTrendSeed(item: Parser.Item): TrendSeed {
  const custom = item as Parser.Item & {
    approxTraffic?: string;
    picture?: string | string[];
    pictureSource?: string | string[];
    newsItems?: Array<{
      "ht:news_item_title"?: string | string[];
      "ht:news_item_snippet"?: string | string[];
      "ht:news_item_url"?: string | string[];
      "ht:news_item_picture"?: string | string[];
      "ht:news_item_source"?: string | string[];
      title?: string;
      snippet?: string;
      url?: string;
      picture?: string;
      source?: string;
    }>;
  };
  const newsItems = custom.newsItems ?? [];
  const firstNewsWithUrl = newsItems.find((newsItem) =>
    asString(newsItem["ht:news_item_url"] ?? newsItem.url)
  );
  const firstNewsWithImage = newsItems.find((newsItem) =>
    asString(newsItem["ht:news_item_picture"] ?? newsItem.picture)
  );
  const sourceUrl =
    asHttpUrl(firstNewsWithUrl?.["ht:news_item_url"] ?? firstNewsWithUrl?.url) ??
    buildTrendSearchUrl(item.title ?? "");
  const imageUrl =
    asHttpUrl(firstNewsWithImage?.["ht:news_item_picture"] ?? firstNewsWithImage?.picture) ??
    asHttpUrl(custom.picture) ??
    null;
  const sourceName =
    asString(firstNewsWithUrl?.["ht:news_item_source"] ?? firstNewsWithUrl?.source) ??
    asString(custom.pictureSource) ??
    GOOGLE_TRENDS_SOURCE;

  return {
    title: item.title?.trim() ?? "",
    sourceUrl,
    sourceName,
    imageUrl,
    traffic: asString(custom.approxTraffic),
    publishedAt: item.isoDate ?? item.pubDate,
    newsTitles: newsItems
      .map((newsItem) =>
        asString(newsItem["ht:news_item_title"] ?? newsItem.title)
      )
      .filter(isString)
      .slice(0, 5),
    newsSnippets: newsItems
      .map((newsItem) =>
        asString(newsItem["ht:news_item_snippet"] ?? newsItem.snippet)
      )
      .filter(isString)
      .slice(0, 5)
  };
}

function asString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("[")) {
      try {
        return asString(JSON.parse(trimmed));
      } catch {
        return trimmed || undefined;
      }
    }

    return trimmed || undefined;
  }

  if (Array.isArray(value)) {
    return asString(value[0]);
  }

  return undefined;
}

function asHttpUrl(value: unknown) {
  const candidate = asString(value);

  if (!candidate) {
    return undefined;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function buildTrendSearchUrl(query: string) {
  return `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`;
}

function classifyTrendIntent(seed: TrendSeed) {
  const text = [seed.title, ...seed.newsTitles, ...seed.newsSnippets]
    .join(" ")
    .toLowerCase();
  const hasHolidayTerm =
    text.includes("memorial day") ||
    text.includes("labor day") ||
    text.includes("thanksgiving") ||
    text.includes("christmas") ||
    text.includes("new year") ||
    text.includes("easter") ||
    text.includes("halloween") ||
    text.includes("juneteenth") ||
    text.includes("independence day") ||
    text.includes("fourth of july") ||
    text.includes("4th of july");

  if (
    text.includes("open today") ||
    text.includes("hours") ||
    text.includes("holiday hours") ||
    text.includes("closed today") ||
    text.includes("open on") ||
    text.includes("closed on")
  ) {
    return "hours-and-status";
  }

  if (hasHolidayTerm) {
    return "holiday-explainer";
  }

  if (
    /\b(is|are|does|do|did|can|when|where|why|how|what)\b/.test(text) ||
    text.includes("?")
  ) {
    return "direct-answer";
  }

  if (
    /\b(nfl|nba|mlb|nhl|wnba|ncaa|soccer|football|baseball|basketball|hockey|ufc|wwe|game|score|match|playoff|final|team|coach|player)\b/.test(
      text
    )
  ) {
    return "sports-context";
  }

  if (
    /\b(celebrity|movie|music|actor|actress|singer|album|tour|show|netflix|disney|trailer|episode)\b/.test(
      text
    )
  ) {
    return "entertainment-context";
  }

  return "news-explainer";
}

function intentInstructions(intent: string) {
  const shared = [
    "Treat the Google Trends query as the target search phrase and answer the likely search intent immediately.",
    "The title should be specific enough to compete for the query, not a vague trend-analysis headline.",
    "Use the exact trending query naturally in the title, opening paragraph, one subheading, and meta description.",
    "If facts are not present in the provided trend/news/source context, say what is known and how readers can verify it; do not invent hours, scores, dates, prices, injuries, quotes, or official statements.",
    "Write for people searching right now, then add context after the direct answer."
  ];

  if (intent === "hours-and-status") {
    return [
      ...shared,
      "Use an article shape like: direct answer, current status/hours, why people are searching, how to verify locally, what to watch next.",
      "For business hours or holiday queries, include a clear caveat that hours can vary by location and readers should verify with the official store locator or local listing.",
      "Example direction: for 'is Chick-fil-A open today', lead with whether the query is about today's/holiday hours, then explain Chick-fil-A hours and local verification without fabricating a universal schedule."
    ];
  }

  if (intent === "holiday-explainer") {
    return [
      ...shared,
      "Use an article shape like: what the holiday/event is, when it falls this year, why people are searching today, origin/history, what is open or closed only if source context supports it, and what to watch next.",
      "For broad holiday keywords like 'Memorial Day', do not make the article only about store hours. Explain the holiday itself, its meaning, timing, history, and why searches spike.",
      "If the keyword is a holiday plus a brand/store/service, then answer that narrower intent. If it is only the holiday/event name, write the broader explainer."
    ];
  }

  if (intent === "direct-answer") {
    return [
      ...shared,
      "Use an article shape like: short answer, details, why it is trending, related questions, what to watch next.",
      "If the query is phrased as a question, answer that question in the first 1-2 sentences before adding analysis."
    ];
  }

  if (intent === "sports-context") {
    return [
      ...shared,
      "Use an article shape like: why this team/player/game is trending, quick background, recent context, history/rivalry if relevant, schedule or next milestone if provided, what fans are searching for.",
      "For sports topics, prioritize team/player context, matchup history, records or schedule only when provided by source context, and explain why casual searchers care."
    ];
  }

  if (intent === "entertainment-context") {
    return [
      ...shared,
      "Use an article shape like: who/what it is, why it is trending now, short timeline, fan/search context, what to watch next.",
      "For entertainment or celebrity topics, avoid gossip beyond the provided source context and focus on verifiable context."
    ];
  }

  return [
    ...shared,
    "Use an article shape like: what happened, why searches are spiking, practical context, related angles, what to watch next.",
    "For random news topics, explain the entity/event clearly enough for readers arriving from search who have no prior context."
  ];
}

async function writeTrendArticle(seed: TrendSeed): Promise<TrendArticle> {
  const searchIntent = classifyTrendIntent(seed);
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "trend_article",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            meta_description: { type: "string" },
            key_takeaways: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            }
          },
          required: ["title", "content", "meta_description", "key_takeaways"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You are an expert search-intent editor and technical SEO strategist for a publisher. Return only valid JSON. Create original, useful articles that directly satisfy the live query intent; do not keyword stuff, fabricate facts, or pretend Google Trends proves more than it does."
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: [
            "Write a timely search article for the 'others' category based on this Google Trends topic.",
            ...intentInstructions(searchIntent),
            "Optimize for search intent first, then add useful context for publishers, creators, founders, marketers, or operators when it fits naturally.",
            "Do not claim exact ranking positions unless provided. Treat traffic numbers as approximate demand signals.",
            "Include why people are searching, what readers should know now, what to watch next, and risks of overreacting to a spike.",
            "Use short paragraphs and include 3-5 markdown-style section headings inside content. Do not escape markdown characters.",
            "Do not include a separate Key Takeaways section inside content because key_takeaways is stored separately.",
            "Generate exactly 3 actionable key_takeaways.",
            `End content with this exact source note: Source: ${GOOGLE_TRENDS_SOURCE}.`
          ],
          searchIntent,
          trend: seed.title,
          approximateTraffic: seed.traffic,
          newsTitles: seed.newsTitles,
          newsSnippets: seed.newsSnippets,
          sourceUrl: seed.sourceUrl
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty trends response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const title = stringifyAiField(parsed.title).trim();
  const contentBody = stringifyAiField(parsed.content).trim();
  const metaDescription = stringifyAiField(parsed.meta_description).trim();

  if (
    !title ||
    !contentBody ||
    !metaDescription ||
    !Array.isArray(parsed.key_takeaways)
  ) {
    throw new Error("OpenAI trends response missed required fields");
  }

  const keyTakeaways = parsed.key_takeaways
    .map((takeaway) => String(takeaway).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (keyTakeaways.length !== 3) {
    throw new Error("OpenAI trends response must include exactly 3 takeaways");
  }

  const sourceCitation = `Source: ${GOOGLE_TRENDS_SOURCE}.`;
  const recommendedTools = getRecommendedToolsForTrend(
    seed.title,
    seed.newsTitles
  );
  const toolsSection = formatToolRecommendationsMarkdown(recommendedTools);
  const bodyWithTools = toolsSection
    ? `${contentBody}\n\n${toolsSection}`
    : contentBody;
  const content = bodyWithTools.includes(sourceCitation)
    ? bodyWithTools
    : `${bodyWithTools}\n\n${sourceCitation}`;

  return {
    title,
    content,
    meta_description: metaDescription,
    key_takeaways: keyTakeaways
  };
}

function stringifyAiField(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stringifyAiField(item)).join("\n\n");
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .map((item) => stringifyAiField(item))
      .filter(Boolean)
      .join("\n\n");
  }

  return "";
}

async function articleExists(sourceUrl: string) {
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (error) {
    throw new Error(`Duplicate check failed: ${error.message}`);
  }

  return Boolean(data);
}

async function createUniqueSlug(title: string) {
  const baseSlug = slugify(title);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Slug check failed: ${error.message}`);
    }

    if (!data) {
      return slug;
    }
  }

  return `${baseSlug}-${generateShareId(6)}`;
}

async function createUniqueShareId() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const shareId = generateShareId();
    const { data, error } = await supabase
      .from("articles")
      .select("id")
      .eq("share_id", shareId)
      .maybeSingle();

    if (error) {
      throw new Error(`Share id check failed: ${error.message}`);
    }

    if (!data) {
      return shareId;
    }
  }

  throw new Error("Failed to generate a unique share_id");
}
