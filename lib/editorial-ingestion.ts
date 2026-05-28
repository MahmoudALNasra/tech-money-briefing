import {
  EDITORIAL_TOPICS,
  editorialSourceUrl,
  type EditorialTopic
} from "@/data/editorial-topics";

import { enrichArticleMedia } from "./article-media";
import {
  articleExistsBySourceUrl,
  createUniqueShareId,
  createUniqueSlug
} from "./article-publish";
import { CORE_CATEGORIES, isCoreCategory } from "./categories";
import {
  formatInternalLinksMarkdown,
  getStaticInternalLinksForText
} from "./internal-links";
import { getOpenAIClient } from "./openai";
import { siteConfig } from "./site";
import { slugify } from "./slug";
import { supabase } from "./supabase";
import {
  formatToolRecommendationsMarkdown,
  getRecommendedToolsForText
} from "./tool-recommendations";
import { runKeywordResearch } from "./keyword-research";

export const EDITORIAL_SOURCE_NAME = "Tech Revenue Brief Editorial";
const AUTO_TOPIC_ID_PREFIX = "auto-";

type EditorialArticle = {
  title: string;
  content: string;
  meta_description: string;
  key_takeaways: string[];
};

export type EditorialIngestionOptions = {
  maxNewArticles?: number;
  topicId?: string;
};

export type EditorialIngestionResult = {
  ok: boolean;
  maxNewArticles: number;
  queued: number;
  processed: number;
  inserted: number;
  skipped: number;
  topics: Array<{ id: string; title: string; status: string }>;
  errors: string[];
};

const EDITORIAL_SYSTEM_PROMPT =
  "You are a senior operator and technical educator writing practical how-to guides for founders, creators, and publishers. Return only valid JSON. Do not invent product features, pricing, or version numbers—stick to widely known capabilities and say when details may change.";

export async function runEditorialIngestion(
  options: EditorialIngestionOptions = {}
): Promise<EditorialIngestionResult> {
  const maxNewArticles = options.maxNewArticles ?? 1;
  const topics = await selectPendingTopics(maxNewArticles, options.topicId);

  const result: EditorialIngestionResult = {
    ok: true,
    maxNewArticles,
    queued: topics.length,
    processed: 0,
    inserted: 0,
    skipped: 0,
    topics: [],
    errors: []
  };

  for (const topic of topics) {
    result.processed += 1;
    const sourceUrl = editorialSourceUrl(topic.id);

    if (await articleExistsBySourceUrl(sourceUrl)) {
      result.skipped += 1;
      result.topics.push({
        id: topic.id,
        title: topic.title,
        status: "already_published"
      });
      continue;
    }

    try {
      const article = await writeEditorialArticle(topic);
      const slug = await createUniqueSlug(article.title);
      const shareId = await createUniqueShareId();

      const { data: insertedArticle, error } = await supabase
        .from("articles")
        .insert({
          title: article.title,
          slug,
          content: article.content,
          meta_description: article.meta_description,
          key_takeaways: article.key_takeaways,
          category: topic.category,
          source_name: EDITORIAL_SOURCE_NAME,
          source_url: sourceUrl,
          image_url: null,
          share_id: shareId,
          status: "published",
          published_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          result.skipped += 1;
          result.topics.push({
            id: topic.id,
            title: topic.title,
            status: "duplicate_skipped"
          });
          continue;
        }

        throw error;
      }

      result.inserted += 1;
      result.topics.push({
        id: topic.id,
        title: article.title,
        status: "published"
      });

      if (insertedArticle?.id) {
        await enrichArticleMedia({
          articleId: String(insertedArticle.id),
          title: article.title,
          category: topic.category,
          metaDescription: article.meta_description
        });
      }
    } catch (error) {
      result.errors.push(
        `${topic.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      result.topics.push({
        id: topic.id,
        title: topic.title,
        status: "error"
      });
    }
  }

  return result;
}

async function selectPendingTopics(limit: number, topicId?: string) {
  if (topicId) {
    const topic = EDITORIAL_TOPICS.find((entry) => entry.id === topicId);

    if (!topic) {
      throw new Error(`Unknown editorial topic id: ${topicId}`);
    }

    return [topic];
  }

  const pending: EditorialTopic[] = [];

  for (const topic of EDITORIAL_TOPICS) {
    if (pending.length >= limit) {
      break;
    }

    const exists = await articleExistsBySourceUrl(editorialSourceUrl(topic.id));

    if (!exists) {
      pending.push(topic);
    }
  }

  if (
    pending.length < limit &&
    process.env.EDITORIAL_AUTO_TOPIC_GENERATION !== "false"
  ) {
    const generatedTopics = await generateAutomatedTopics({
      count: limit - pending.length,
      avoidTitles: [
        ...EDITORIAL_TOPICS.map((topic) => topic.title),
        ...(await loadRecentEditorialTitles())
      ]
    });

    for (const topic of generatedTopics) {
      if (pending.length >= limit) {
        break;
      }

      const exists = await articleExistsBySourceUrl(editorialSourceUrl(topic.id));

      if (!exists) {
        pending.push(topic);
      }
    }
  }

  return pending;
}

async function loadRecentEditorialTitles() {
  const { data, error } = await supabase
    .from("articles")
    .select("title")
    .eq("source_name", EDITORIAL_SOURCE_NAME)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) {
    throw new Error(`Failed to load recent editorial titles: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => String((row as Record<string, unknown>).title ?? "").trim())
    .filter(Boolean);
}

async function generateAutomatedTopics(input: {
  count: number;
  avoidTitles: string[];
}): Promise<EditorialTopic[]> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.35,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "editorial_topic_queue",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            topics: {
              type: "array",
              minItems: input.count,
              maxItems: input.count,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  category: { type: "string", enum: [...CORE_CATEGORIES] },
                  angle: { type: "string" },
                  referenceUrls: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["title", "category", "angle", "referenceUrls"]
              }
            }
          },
          required: ["topics"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You generate practical, search-intent editorial topics for Tech Revenue Brief. Return only valid JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          count: input.count,
          allowedCategories: CORE_CATEGORIES,
          avoidTitles: input.avoidTitles.slice(0, 120),
          instructions: [
            "Generate topics that real people might search for in Google.",
            "Prefer how-to, vs, best tools, calculator, checklist, template, mistakes, and beginner-guide formats.",
            "Focus on AI tools, Cursor, ChatGPT, Claude, SEO, creator monetization, digital marketing, ecommerce, startups, and fintech operations.",
            "Each topic should be specific enough to become a useful 900-1300 word guide.",
            "Do not repeat or lightly rephrase any avoidTitles item.",
            "Avoid celebrity/news/trend topics; this queue is evergreen."
          ]
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error("OpenAI returned an empty editorial topic response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const topicRows = Array.isArray(parsed.topics) ? parsed.topics : [];
  const generatedTopics: EditorialTopic[] = [];

  for (const row of topicRows) {
    const topic = row as Record<string, unknown>;
    const title = String(topic.title ?? "").trim();
    const category = String(topic.category ?? "").trim();
    const angle = String(topic.angle ?? "").trim();
    const referenceUrls = Array.isArray(topic.referenceUrls)
      ? topic.referenceUrls
          .map((url) => String(url).trim())
          .filter((url) => url.startsWith("https://"))
      : [];

    if (!title || !angle || !isCoreCategory(category)) {
      continue;
    }

    generatedTopics.push({
      id: `${AUTO_TOPIC_ID_PREFIX}${slugify(title)}`,
      title,
      category,
      angle,
      referenceUrls
    });
  }

  return generatedTopics;
}

async function writeEditorialArticle(topic: EditorialTopic): Promise<EditorialArticle> {
  const keywordPlan = await runKeywordResearch({
    seed: topic.title,
    category: topic.category,
    hints: {
      brand: topic.title.split(" ")[0],
      isReferral: false
    }
  });

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.45,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "editorial_guide_article",
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
        content: EDITORIAL_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: JSON.stringify({
          siteName: siteConfig.name,
          instructions: [
            "Write an original practical guide (not a news rewrite).",
            "Target readers: founders, creators, publishers, and operators.",
            "Treat the working title as the primary search query. Keep the final title close to that query unless clarity requires a small rewrite.",
            "Satisfy search intent before adding commentary: answer what the reader probably typed into Google in the first paragraph and again in ## Quick Answer.",
            "Use the primary query naturally in the title, opening paragraph, one H2 or H3, meta_description, and one FAQ question.",
            "Use this keyword research plan to cover variants and common misspellings naturally (misspellings only in FAQ or a short note):",
            JSON.stringify(keywordPlan),
            "Include concrete examples, decision rules, setup steps, and failure modes. Avoid vague advice like 'be strategic' unless it is followed by a specific action.",
            "Use markdown with ## and ### headings only (no H1 in body).",
            "Open with a 40-60 word direct answer to the main question.",
            "Include sections: ## Quick Answer, step-by-step workflow (numbered steps in prose or lists), common mistakes, a short checklist or decision framework, and ## FAQ with 3-4 questions.",
            "Aim for 900-1300 words. Be specific and actionable.",
            "Include 2-4 natural internal markdown links between paragraphs to on-site tools, hub pages, or comparisons when relevant (paths like /ai-headline-generator, /tools, /compare/beehiiv-vs-substack). The links should be highlighted by normal markdown syntax and should help the reader take the next step.",
            "Do not cite fake statistics or fabricated quotes.",
            "End content with: Source: Tech Revenue Brief Editorial.",
            "Generate exactly 3 actionable key_takeaways.",
            "meta_description: exactly 2 sentences, under 160 characters total if possible."
          ],
          topic: {
            workingTitle: topic.title,
            category: topic.category,
            angle: topic.angle,
            referenceUrls: topic.referenceUrls ?? []
          }
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error("OpenAI returned an empty editorial response");
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
    throw new Error("OpenAI editorial response missed required fields");
  }

  const keyTakeaways = parsed.key_takeaways
    .map((takeaway) => String(takeaway).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (keyTakeaways.length !== 3) {
    throw new Error("OpenAI editorial response must include exactly 3 takeaways");
  }

  const haystack = [title, topic.angle, topic.title, topic.category].join(" ");
  const tools = getRecommendedToolsForText(haystack, 3, true);
  const toolHrefs = new Set(tools.map((tool) => tool.href));
  const toolsSection = formatToolRecommendationsMarkdown(
    tools,
    siteConfig.url
  ).replace("## Useful tools for this trend", "## Tools mentioned in this guide");
  const internalLinks = formatInternalLinksMarkdown(
    getStaticInternalLinksForText(haystack, 6)
      .filter((item) => !toolHrefs.has(item.href))
      .slice(0, 4)
  );

  const sections = [contentBody, toolsSection, internalLinks].filter(Boolean);
  const sourceCitation = `Source: ${EDITORIAL_SOURCE_NAME}.`;
  const body = sections.join("\n\n");
  const content = body.includes(sourceCitation)
    ? body
    : `${body}\n\n${sourceCitation}`;

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
