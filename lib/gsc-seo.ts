import type { CoreCategory } from "./categories";
import { CORE_CATEGORIES, isCoreCategory } from "./categories";
import type { GscSearchRow } from "./google-search-console";
import { fetchAllGscQueryPageRows } from "./google-search-console";
import { getOpenAIClient } from "./openai";
import { siteConfig } from "./site";
import { slugify } from "./slug";
import { supabase } from "./supabase";
import type { EditorialTopic } from "@/data/editorial-topics";

export type GscOpportunityType = "improve_existing" | "create_article";

export type GscOpportunity = {
  type: GscOpportunityType;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  score: number;
  reason: string;
  article?: {
    id: string;
    slug: string;
    category: string;
    title: string;
  };
  suggestedTopic?: EditorialTopic;
};

type PublishedArticleRef = {
  id: string;
  slug: string;
  category: string;
  title: string;
  meta_description: string;
};

// Default 3 suits newer sites; raise to 15+ once you have steady Search Console volume.
const MIN_IMPRESSIONS = Number(process.env.GSC_MIN_IMPRESSIONS ?? 3);
const CREATE_MIN_IMPRESSIONS = Number(
  process.env.GSC_CREATE_MIN_IMPRESSIONS ?? MIN_IMPRESSIONS
);
const MIN_IMPROVE_POSITION = Number(process.env.GSC_MIN_IMPROVE_POSITION ?? 4);
const MAX_IMPROVE_POSITION = Number(process.env.GSC_MAX_IMPROVE_POSITION ?? 35);
const LOW_CTR_THRESHOLD = Number(process.env.GSC_LOW_CTR_THRESHOLD ?? 0.03);

const OFF_TOPIC_PATTERNS = [
  /\b(nfl|nba|mlb|nhl|ipl|soccer|football|baseball|basketball)\b/i,
  /\b(celebrity|kardashian|affleck|taylor swift)\b/i,
  /\b(memorial day hours|costco hours|is .* open today)\b/i
];

export async function loadPublishedArticleRefs() {
  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,category,title,meta_description")
    .eq("status", "published")
    .limit(5000);

  if (error) {
    throw new Error(`Failed to load articles for GSC matching: ${error.message}`);
  }

  return (data ?? []) as PublishedArticleRef[];
}

export function parseArticlePathFromGscPage(page: string) {
  try {
    const url = new URL(page, siteConfig.url);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length >= 2) {
      return {
        category: parts[0],
        slug: parts.slice(1).join("/")
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function matchArticleFromPage(
  page: string,
  articles: PublishedArticleRef[]
) {
  const parsed = parseArticlePathFromGscPage(page);
  if (!parsed) {
    return null;
  }

  return (
    articles.find(
      (article) =>
        article.category === parsed.category && article.slug === parsed.slug
    ) ?? null
  );
}

function isOnTopicQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 3) {
    return false;
  }

  return !OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized));
}

function opportunityScore(row: GscSearchRow) {
  const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;
  let score = Math.log10(row.impressions + 1) * 20;

  if (row.position >= 8 && row.position <= 30) {
    score += 35;
  } else if (row.position >= 4 && row.position < 8) {
    score += 25;
  }

  if (row.impressions >= 30 && ctr < LOW_CTR_THRESHOLD) {
    score += 20;
  }

  if (row.clicks > 0) {
    score += 10;
  }

  return Math.round(score * 10) / 10;
}

function buildReason(row: GscSearchRow, type: GscOpportunityType) {
  const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(1) : "0.0";

  if (type === "improve_existing") {
    return `Position ${row.position.toFixed(1)} with ${row.impressions} impressions and ${ctr}% CTR — optimize title, meta, and FAQ for this query.`;
  }

  return `Query has ${row.impressions} impressions at position ${row.position.toFixed(1)} but no strong matching article — create a focused guide.`;
}

export function buildGscOpportunities(
  rows: GscSearchRow[],
  articles: PublishedArticleRef[]
) {
  const byQueryPage = new Map<string, GscSearchRow>();

  for (const row of rows) {
    if (!row.query || row.impressions < MIN_IMPRESSIONS) {
      continue;
    }

    if (!isOnTopicQuery(row.query)) {
      continue;
    }

    const key = `${row.query}|||${row.page}`;
    const existing = byQueryPage.get(key);

    if (!existing || row.impressions > existing.impressions) {
      byQueryPage.set(key, row);
    }
  }

  const opportunities: GscOpportunity[] = [];

  for (const row of byQueryPage.values()) {
    const article = row.page ? matchArticleFromPage(row.page, articles) : null;
    const inStrikeZone =
      row.position >= MIN_IMPROVE_POSITION && row.position <= MAX_IMPROVE_POSITION;
    const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;
    const lowCtr = ctr < LOW_CTR_THRESHOLD;

    if (article && inStrikeZone && (lowCtr || row.position > 12)) {
      opportunities.push({
        type: "improve_existing",
        query: row.query,
        page: row.page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr,
        position: row.position,
        score: opportunityScore(row),
        reason: buildReason(row, "improve_existing"),
        article: {
          id: article.id,
          slug: article.slug,
          category: article.category,
          title: article.title
        }
      });
      continue;
    }

    if (!article && row.impressions >= CREATE_MIN_IMPRESSIONS && inStrikeZone) {
      opportunities.push({
        type: "create_article",
        query: row.query,
        page: row.page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr,
        position: row.position,
        score: opportunityScore(row) + 5,
        reason: buildReason(row, "create_article")
      });
    }
  }

  const deduped = new Map<string, GscOpportunity>();

  for (const opportunity of opportunities.sort((a, b) => b.score - a.score)) {
    const key =
      opportunity.type === "improve_existing" && opportunity.article
        ? `improve:${opportunity.article.id}`
        : `create:${opportunity.query.toLowerCase()}`;

    if (!deduped.has(key)) {
      deduped.set(key, opportunity);
    }
  }

  return [...deduped.values()].sort((a, b) => b.score - a.score);
}

export async function fetchGscOpportunities(options?: { days?: number }) {
  const [rows, articles] = await Promise.all([
    fetchAllGscQueryPageRows({ days: options?.days }),
    loadPublishedArticleRefs()
  ]);

  return buildGscOpportunities(rows, articles);
}

export async function gscQueryToEditorialTopic(
  query: string,
  relatedQueries: string[] = []
): Promise<EditorialTopic> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.25,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "gsc_editorial_topic",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            category: { type: "string", enum: [...CORE_CATEGORIES] },
            angle: { type: "string" }
          },
          required: ["title", "category", "angle"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You turn Google Search Console queries into practical editorial topics for Tech Revenue Brief. Return only valid JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          primaryQuery: query,
          relatedQueries: relatedQueries.slice(0, 8),
          allowedCategories: CORE_CATEGORIES.filter((c) => c !== "others"),
          instructions: [
            "Create one how-to or explainer topic that matches the search intent.",
            "Title should sound like something a founder, marketer, or operator would click.",
            "Angle should explain what the article will teach and who it is for.",
            "Prefer ai-tools, seo, digital-marketing, startups, ecommerce, fintech, or creator-business."
          ]
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty GSC editorial topic response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const category = String(parsed.category ?? "seo");
  const safeCategory: CoreCategory = isCoreCategory(category) ? category : "seo";

  return {
    id: `gsc-${slugify(query).slice(0, 52)}`,
    title: String(parsed.title ?? query).trim(),
    category: safeCategory,
    angle: String(parsed.angle ?? `Answer search demand for "${query}".`).trim(),
    referenceUrls: []
  };
}

export async function attachSuggestedTopics(opportunities: GscOpportunity[]) {
  const createOps = opportunities.filter((op) => op.type === "create_article");
  const queryClusters = new Map<string, string[]>();

  for (const op of createOps) {
    const key = op.query.toLowerCase();
    const list = queryClusters.get(key) ?? [];
    list.push(op.query);
    queryClusters.set(key, list);
  }

  const enriched: GscOpportunity[] = [];

  for (const opportunity of opportunities) {
    if (opportunity.type !== "create_article") {
      enriched.push(opportunity);
      continue;
    }

    const topic = await gscQueryToEditorialTopic(opportunity.query);
    enriched.push({ ...opportunity, suggestedTopic: topic });
  }

  return enriched;
}
