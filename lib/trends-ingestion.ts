import OpenAI from "openai";
import Parser from "rss-parser";

import { generateShareId } from "./share-id";
import { slugify } from "./slug";
import { supabase } from "./supabase";

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
};

type TrendsIngestionOptions = {
  maxNewArticles?: number;
  maxTrends?: number;
  geo?: string;
};

const TREND_CATEGORY = "others";
const GOOGLE_TRENDS_SOURCE = "Google Trends";

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
  const maxNewArticles = options.maxNewArticles ?? 3;
  const maxTrends = options.maxTrends ?? Math.max(maxNewArticles * 4, 12);
  const geo = options.geo ?? process.env.GOOGLE_TRENDS_GEO ?? "US";
  const feedUrl =
    process.env.GOOGLE_TRENDS_RSS_URL ??
    `https://trends.google.com/trending/rss?geo=${encodeURIComponent(
      geo
    )}`;

  const feed = await parser.parseURL(feedUrl);
  const seeds = feed.items.slice(0, maxTrends).map(toTrendSeed);
  const result = {
    ok: true,
    source: GOOGLE_TRENDS_SOURCE,
    geo,
    maxNewArticles,
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

    if (await articleExists(seed.sourceUrl)) {
      result.skipped += 1;
      continue;
    }

    try {
      const article = await writeTrendArticle(seed);
      const slug = await createUniqueSlug(article.title);
      const shareId = await createUniqueShareId();

      const { error } = await supabase.from("articles").insert({
        title: article.title,
        slug,
        content: article.content,
        meta_description: article.meta_description,
        key_takeaways: article.key_takeaways,
        category: TREND_CATEGORY,
        source_name:
          seed.sourceName === GOOGLE_TRENDS_SOURCE
            ? GOOGLE_TRENDS_SOURCE
            : `${GOOGLE_TRENDS_SOURCE} / ${seed.sourceName}`,
        source_url: seed.sourceUrl,
        image_url: seed.imageUrl,
        share_id: shareId,
        status: "published",
        published_at: seed.publishedAt ?? new Date().toISOString()
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
        `${seed.title}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
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
    asString(firstNewsWithUrl?.["ht:news_item_url"] ?? firstNewsWithUrl?.url) ??
    buildTrendSearchUrl(item.title ?? "");
  const imageUrl =
    asString(firstNewsWithImage?.["ht:news_item_picture"] ?? firstNewsWithImage?.picture) ??
    asString(custom.picture) ??
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
    return value.trim() || undefined;
  }

  if (Array.isArray(value)) {
    return asString(value[0]);
  }

  return undefined;
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function buildTrendSearchUrl(query: string) {
  return `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`;
}

async function writeTrendArticle(seed: TrendSeed): Promise<TrendArticle> {
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
          "You are an expert trend analyst and technical SEO strategist for a publisher. Return only valid JSON. Create original, useful analysis; do not keyword stuff, fabricate facts, or pretend Google Trends proves more than it does."
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: [
            "Write a timely article for the 'others' category based on this Google Trends topic.",
            "Use the trending query naturally in the title, opening paragraph, one subheading, and meta description.",
            "Optimize for search intent with clear explanations, related context, and useful angles for publishers, creators, founders, marketers, or operators.",
            "Do not claim exact ranking positions unless provided. Treat traffic numbers as approximate demand signals.",
            "Include practical implications, why people are searching, what to watch next, and risks of overreacting to a spike.",
            "Use short paragraphs and include 3-5 markdown-style section headings inside content.",
            "Generate exactly 3 actionable key_takeaways.",
            `End content with this exact source note: Source: ${GOOGLE_TRENDS_SOURCE}.`
          ],
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
  const content = contentBody.includes(sourceCitation)
    ? contentBody
    : `${contentBody}\n\n${sourceCitation}`;

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
