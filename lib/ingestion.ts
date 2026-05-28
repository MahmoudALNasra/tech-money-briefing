import Parser from "rss-parser";

import { enrichArticleMedia } from "./article-media";
import { getOpenAIClient } from "./openai";
import { revalidateSiteCache } from "./revalidate-site";
import { generateShareId } from "./share-id";
import { slugify, normalizeCategory } from "./slug";
import { supabase } from "./supabase";
import type { Source } from "./types";
import { runKeywordResearch } from "./keyword-research";

type RewrittenArticle = {
  title: string;
  content: string;
  meta_description: string;
  key_takeaways: string[];
};

type IngestionResult = {
  source: string;
  processed: number;
  inserted: number;
  skipped: number;
  errors: string[];
};

type IngestionOptions = {
  maxNewArticles?: number;
  maxItemsPerSource?: number;
};

class IrrelevantArticleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IrrelevantArticleError";
  }
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "AutomatedNewsAggregator/1.0 (+https://example.com; RSS ingestion)"
  }
});

const defaultMaxItemsPerSource = Number(
  process.env.INGEST_MAX_ITEMS_PER_SOURCE ?? 25
);
const defaultMaxNewArticles = Number(process.env.INGEST_MAX_NEW_ARTICLES ?? 3);

export const INDUSTRY_ANALYST_SYSTEM_PROMPT =
  "You are an expert industry analyst and technical SEO strategist for a hyper-niche B2B intelligence publication. Your job is to create original information gain for professionals, not generic news rewrites. Return only valid JSON.";

export async function runIngestion(options: IngestionOptions = {}) {
  const maxNewArticles = options.maxNewArticles ?? defaultMaxNewArticles;
  const maxItemsPerSource = options.maxItemsPerSource ?? defaultMaxItemsPerSource;
  const budget = {
    remaining: maxNewArticles,
    insertedPaths: [] as string[]
  };

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .order("last_scraped_at", { ascending: true, nullsFirst: true });

  if (error) {
    throw new Error(`Failed to load RSS sources: ${error.message}`);
  }

  const sources = (data ?? []) as Source[];
  const results: IngestionResult[] = [];

  for (const source of sources) {
    if (budget.remaining <= 0) {
      break;
    }

    results.push(
      await ingestSource(source, {
        maxItemsPerSource,
        budget
      })
    );
  }

  if (budget.insertedPaths.length > 0) {
    try {
      await revalidateSiteCache({
        paths: ["/", ...budget.insertedPaths],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[ingest] Revalidate failed", error);
    }
  }

  return {
    ok: true,
    sourceCount: sources.length,
    maxNewArticles,
    remainingBudget: budget.remaining,
    results
  };
}

async function ingestSource(
  source: Source,
  options: {
    maxItemsPerSource: number;
    budget: { remaining: number; insertedPaths: string[] };
  }
): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: source.name,
    processed: 0,
    inserted: 0,
    skipped: 0,
    errors: []
  };

  try {
    const feed = await parser.parseURL(source.rss_url);
    const items = feed.items.slice(0, options.maxItemsPerSource);

    for (const item of items) {
      if (options.budget.remaining <= 0) {
        break;
      }

      result.processed += 1;

      const sourceUrl = item.link?.trim();
      const rawContent = extractContent(item);
      const rawTitle = item.title?.trim();

      if (!sourceUrl || !rawTitle || !rawContent) {
        result.skipped += 1;
        continue;
      }

      const alreadyProcessed = await articleExists(sourceUrl);

      if (alreadyProcessed) {
        result.skipped += 1;
        continue;
      }

      try {
        const rewritten = await rewriteArticle({
          title: rawTitle,
          content: rawContent,
          sourceName: source.name,
          category: source.category
        });

        const slug = await createUniqueSlug(rewritten.title);
        const shareId = await createUniqueShareId();
        const imageUrl =
          extractImageUrl(item) ?? (await fetchOpenGraphImage(sourceUrl));
        const publishedAt =
          item.isoDate ?? item.pubDate ?? new Date().toISOString();

        const { data: insertedArticle, error: insertError } = await supabase
          .from("articles")
          .insert({
            title: rewritten.title,
            slug,
            content: rewritten.content,
            meta_description: rewritten.meta_description,
            key_takeaways: rewritten.key_takeaways,
            category: normalizeCategory(source.category),
            source_name: source.name,
            source_url: sourceUrl,
            image_url: imageUrl,
            share_id: shareId,
            status: "published",
            published_at: publishedAt
          })
          .select("id")
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            result.skipped += 1;
            continue;
          }

          throw insertError;
        }

        result.inserted += 1;
        options.budget.remaining -= 1;
        options.budget.insertedPaths.push(`/${normalizeCategory(source.category)}/${slug}`);

        if (insertedArticle?.id) {
          await enrichArticleMedia({
            articleId: String(insertedArticle.id),
            title: rewritten.title,
            category: normalizeCategory(source.category),
            metaDescription: rewritten.meta_description
          });
        }
      } catch (error) {
        if (error instanceof IrrelevantArticleError) {
          result.skipped += 1;
          continue;
        }

        result.errors.push(
          `${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    await supabase
      .from("sources")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("id", source.id);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

function extractContent(item: Parser.Item) {
  const itemWithCustomFields = item as Parser.Item & {
    "content:encoded"?: string;
    summary?: string;
  };

  return (
    itemWithCustomFields["content:encoded"] ??
    item.content ??
    item.contentSnippet ??
    itemWithCustomFields.summary ??
    ""
  )
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function extractImageUrl(item: Parser.Item) {
  const enclosureUrl = item.enclosure?.url;
  const itemWithMedia = item as Parser.Item & {
    "media:content"?:
      | {
          $?: { url?: string };
          url?: string;
        }
      | undefined;
    "media:thumbnail"?:
      | {
          $?: { url?: string };
          url?: string;
        }
      | undefined;
    image?: string | { url?: string };
    "content:encoded"?: string;
  };
  const mediaContent = itemWithMedia["media:content"] as
    | { $?: { url?: string }; url?: string }
    | undefined;
  const mediaThumbnail = itemWithMedia["media:thumbnail"] as
    | { $?: { url?: string }; url?: string }
    | undefined;
  const itemImage =
    typeof itemWithMedia.image === "string"
      ? itemWithMedia.image
      : itemWithMedia.image?.url;
  const embeddedImage = extractFirstImageFromHtml(
    itemWithMedia["content:encoded"] ?? item.content ?? ""
  );

  return (
    enclosureUrl ??
    mediaContent?.$?.url ??
    mediaContent?.url ??
    mediaThumbnail?.$?.url ??
    mediaThumbnail?.url ??
    itemImage ??
    embeddedImage ??
    null
  );
}

function extractFirstImageFromHtml(html: string) {
  const sourceSetMatch = html.match(/<img[^>]+srcset=["']([^"']+)["']/i);

  if (sourceSetMatch?.[1]) {
    const firstSource = sourceSetMatch[1].split(",")[0]?.trim().split(/\s+/)[0];

    if (firstSource?.startsWith("http")) {
      return firstSource;
    }
  }

  const sourceMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);

  return sourceMatch?.[1]?.startsWith("http") ? sourceMatch[1] : null;
}

export async function fetchOpenGraphImage(sourceUrl: string) {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "AutomatedNewsAggregator/1.0 (+https://example.com; image discovery)"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    return (
      extractMetaImage(html, "property", "og:image") ??
      extractMetaImage(html, "name", "twitter:image") ??
      extractMetaImage(html, "property", "og:image:url") ??
      extractFirstImageFromHtml(html)
    );
  } catch {
    return null;
  }
}

function extractMetaImage(html: string, attr: "property" | "name", value: string) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const metaRegex = new RegExp(
    `<meta[^>]+${attr}=["']${escapedValue}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reverseMetaRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapedValue}["'][^>]*>`,
    "i"
  );
  const match = html.match(metaRegex) ?? html.match(reverseMetaRegex);
  const imageUrl = match?.[1]?.replace(/&amp;/g, "&");

  return imageUrl?.startsWith("http") ? imageUrl : null;
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

async function rewriteArticle(input: {
  title: string;
  content: string;
  sourceName: string;
  category: string;
}): Promise<RewrittenArticle> {
  const keywordPlan = await runKeywordResearch({
    seed: input.title,
    category: input.category
  });

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.45,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "industry_analyst_article",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            is_relevant: { type: "boolean" },
            relevance_reason: { type: "string" },
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
          required: [
            "is_relevant",
            "relevance_reason",
            "title",
            "content",
            "meta_description",
            "key_takeaways"
          ]
        }
      }
    },
    messages: [
      {
        role: "system",
        content: INDUSTRY_ANALYST_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: [
            `First decide if the original article is genuinely relevant to the niche category "${input.category}". Do not force an unrelated article into the niche.`,
            "Always return all schema fields. If the article is not clearly relevant, set is_relevant false, explain relevance_reason, and use empty strings for title/content/meta_description plus three short skip reasons in key_takeaways.",
            "Write a highly specific, niche-targeted title for professionals in this industry.",
            "Summarize the original article quickly, then dedicate at least 50% of the output to explaining why this matters for professionals in this industry.",
            "Add original analysis, operational implications, buyer or operator context, and concrete risks or opportunities without inventing facts.",
            "Use markdown with ## and ### headings only. Start with a short direct-answer opening paragraph, then include a ## Quick Answer section, practical implications, what to watch next, and a ## FAQ section when the topic supports it.",
            "Use short paragraphs, clear subheadings, and concrete examples so the article renders with the same readable structure as other Tech Revenue Brief guides.",
            "Generate exactly 3 actionable key_takeaways as short bullet-ready strings.",
            "When relevant, include 2-4 natural internal markdown links between paragraphs to related tools or comparison pages on this site. Use paths like /adsense-revenue-calculator, /ai-headline-generator, /tools, or /compare/beehiiv-vs-substack. The links should help the reader take the next step and should not feel forced.",
            "Generate a concise meta_description between 120 and 155 characters. It must fit a search snippet and should not exceed 160 characters.",
            "Use this keyword research plan to cover variants and common misspellings naturally (misspellings only in FAQ or a short note):",
            JSON.stringify(keywordPlan),
            `Cite the original source clearly at the bottom of content with this exact format: Source: ${input.sourceName}.`,
            "For relevant articles, set is_relevant true and return complete title, content, meta_description, and key_takeaways fields."
          ],
          sourceName: input.sourceName,
          category: input.category,
          originalTitle: input.title,
          originalContent: input.content
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error("OpenAI returned an empty rewrite response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (parsed.is_relevant === false) {
    throw new IrrelevantArticleError(
      `Skipped off-niche article: ${stringifyAiField(parsed.relevance_reason) || input.title}`
    );
  }

  const title = stringifyAiField(parsed.title).trim();
  const contentBody = stringifyAiField(parsed.content).trim();
  const metaDescription = stringifyAiField(parsed.meta_description).trim();

  if (
    !title ||
    !contentBody ||
    !metaDescription ||
    !Array.isArray(parsed.key_takeaways)
  ) {
    throw new Error("OpenAI rewrite response missed required fields");
  }

  const keyTakeaways = parsed.key_takeaways
    .map((takeaway) => String(takeaway).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (keyTakeaways.length !== 3) {
    throw new Error("OpenAI rewrite response must include exactly 3 takeaways");
  }

  const sourceCitation = `Source: ${input.sourceName}.`;
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
