import {
  ARTICLE_EDITORIAL_SOURCE_NAME,
  ARTICLE_ORIGINALITY_INSTRUCTIONS,
  OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
  OWNER_VOICE_REWRITE_GUIDE,
  detectOwnerVoiceTemplateSignals,
  stripGeneratedSourceFooter
} from "./article-attribution";
import { normalizeArticleContent } from "./article-markdown";
import { enrichArticleMedia } from "./article-media";
import { syncLocalizedArticleHeroImage } from "./article-hero-localization";
import { syncArticleInlineImages } from "./article-inline-images";
import {
  shouldHideArticleForAdsense
} from "./adsense-readiness";
import type { CoreCategory } from "./categories";
import { isCoreCategory } from "./categories";
import {
  OWNER_VOICE_AEO_GOLD_EXCERPT,
  OWNER_VOICE_AEO_STRUCTURE_RULES,
  OWNER_VOICE_WORD_TARGETS,
  polishOwnerVoiceLinks,
  validateAeoOwnerVoiceContent
} from "./owner-voice/aeo-content";
import { cleanOwnerVoiceArticleTitle } from "./owner-voice/title-cleanup";
import { getOpenAIClient } from "./openai";
import { generateShareId } from "./share-id";
import { slugify } from "./slug";
import { supabase } from "./supabase";
import {
  collectTrendSeedsForIngestion,
  hydrateTrendSeedForIngestion,
  type TrendSeed
} from "./trends-ingestion";
import { isAdsenseReviewMode } from "./adsense-readiness";
import { fetchOpenGraphImage } from "./ingestion";

const CATEGORY_KEYWORDS: Record<Exclude<CoreCategory, "others">, string[]> = {
  "ai-tools": ["ai", "chatgpt", "claude", "gpt", "llm", "openai", "copilot", "gemini", "anthropic"],
  "digital-marketing": [
    "marketing",
    "ads",
    "campaign",
    "facebook",
    "instagram",
    "tiktok",
    "attribution"
  ],
  seo: ["seo", "search", "google", "ranking", "serp", "keyword", "backlink", "lighthouse"],
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

const REJECTED_INTENTS = new Set([
  "sports-context",
  "entertainment-context",
  "hours-and-status",
  "holiday-explainer"
]);

type OwnerVoiceTrendArticle = {
  title: string;
  content: string;
  meta_description: string;
  key_takeaways: string[];
};

export type OwnerVoiceTrendsIngestionOptions = {
  maxNewArticles?: number;
  maxTrends?: number;
  geo?: string;
};

function normalizeTrendText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function classifyTrendIntent(seed: TrendSeed) {
  const text = [seed.title, ...seed.newsTitles, ...seed.newsSnippets]
    .join(" ")
    .toLowerCase();

  if (
    /\b(nfl|nba|mlb|nhl|wnba|ncaa|soccer|football|baseball|basketball|hockey|ufc|wwe|game|score|match|playoff|final|team|coach|player|world cup)\b/.test(
      text
    )
  ) {
    return "sports-context";
  }

  if (
    /\b(celebrity|movie|music|actor|actress|singer|album|tour|show|netflix|disney|trailer|episode|jordan|sneaker|graduation shooting)\b/.test(
      text
    )
  ) {
    return "entertainment-context";
  }

  if (
    text.includes("open today") ||
    text.includes("hours") ||
    text.includes("closed today") ||
    text.includes("memorial day") ||
    text.includes("labor day")
  ) {
    return "hours-and-status";
  }

  if (text.includes("memorial day") || text.includes("thanksgiving")) {
    return "holiday-explainer";
  }

  return "news-explainer";
}

function keywordMatchesHaystack(haystack: string, keyword: string) {
  if (keyword.length <= 3) {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return pattern.test(haystack);
  }

  return haystack.includes(keyword);
}

function resolveTrendCategory(seed: TrendSeed): Exclude<CoreCategory, "others"> | null {
  const haystack = normalizeTrendText(
    [seed.title, ...seed.newsTitles, ...seed.newsSnippets].join(" ")
  );

  let bestCategory: Exclude<CoreCategory, "others"> | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [Exclude<CoreCategory, "others">, string[]]
  >) {
    const score = keywords.reduce(
      (inner, keyword) =>
        keywordMatchesHaystack(haystack, keyword) ? inner + 1 : inner,
      0
    );

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 2 ? bestCategory : null;
}

function shouldSkipOwnerVoiceTrend(seed: TrendSeed, category: CoreCategory) {
  const intent = classifyTrendIntent(seed);

  if (REJECTED_INTENTS.has(intent)) {
    return `rejected intent (${intent})`;
  }

  if (
    shouldHideArticleForAdsense({
      title: seed.title,
      category,
      source_name: ARTICLE_EDITORIAL_SOURCE_NAME
    })
  ) {
    return "low-value title pattern";
  }

  return null;
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

function validateOwnerVoiceTrendDraft(
  seed: TrendSeed,
  draft: OwnerVoiceTrendArticle,
  category: CoreCategory
) {
  const issues = [
    ...validateAeoOwnerVoiceContent(draft.content),
    ...detectOwnerVoiceTemplateSignals(draft.content)
  ];

  if (
    shouldHideArticleForAdsense({
      title: draft.title,
      category,
      source_name: ARTICLE_EDITORIAL_SOURCE_NAME
    })
  ) {
    issues.push("title matches low-value pattern");
  }

  const queryToken = seed.title.toLowerCase().split(/\s+/).filter((t) => t.length >= 4)[0];
  if (
    queryToken &&
    !draft.title.toLowerCase().includes(queryToken) &&
    !draft.content.toLowerCase().includes(queryToken)
  ) {
    issues.push("weak query match");
  }

  return issues;
}

async function writeOwnerVoiceTrendArticle(
  seed: TrendSeed,
  category: CoreCategory,
  retryFeedback?: string[]
): Promise<OwnerVoiceTrendArticle> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_REWRITE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0.45,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "owner_voice_trend_article",
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
          "You write owner-voice AEO briefs for Tech Revenue Brief. Return only valid JSON. Be skeptical, first-person, specific, and honest about what is unverified in a trend."
      },
      {
        role: "user",
        content: JSON.stringify({
          trendQuery: seed.title,
          approximateTraffic: seed.traffic,
          newsTitles: seed.newsTitles,
          newsSnippets: seed.newsSnippets,
          category,
          retryFeedback,
          goldExcerpt: OWNER_VOICE_AEO_GOLD_EXCERPT,
          rules: [
            ...ARTICLE_ORIGINALITY_INSTRUCTIONS,
            ...OWNER_VOICE_REWRITE_GUIDE,
            ...OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
            ...OWNER_VOICE_AEO_STRUCTURE_RULES,
            `Target ${OWNER_VOICE_WORD_TARGETS.idealMin}-${OWNER_VOICE_WORD_TARGETS.idealMax} words.`,
            "Do not add ## FAQ. Use ## Quick Answer plus 3-4 body sections.",
            "Do not invent quotes, scores, arrests, prices, or official statements.",
            "Explain why operators/founders might care, what to verify, and what not to overreact to.",
            "Use the trend query naturally in the title and opening — not keyword stuffing.",
            "Never put markdown links inside ## headings.",
            "Include at least one external link to an official product, docs, or news source when relevant.",
            "End on one sharp practical sentence — no recap section."
          ]
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error("OpenAI returned an empty owner-voice trend response");
  }

  const parsed = JSON.parse(raw) as OwnerVoiceTrendArticle;

  return {
    title: cleanOwnerVoiceArticleTitle(parsed.title).cleaned,
    meta_description: parsed.meta_description.trim().slice(0, 160),
    content: normalizeArticleContent(
      polishOwnerVoiceLinks(stripGeneratedSourceFooter(parsed.content), { category })
    ),
    key_takeaways: parsed.key_takeaways.map((item) => item.trim()).slice(0, 3)
  };
}

function getUsableTrendImage(url: string | null | undefined) {
  if (!url || url.includes("encrypted-tbn")) {
    return null;
  }

  return url;
}

export async function runOwnerVoiceTrendsIngestion(
  options: OwnerVoiceTrendsIngestionOptions = {}
) {
  if (isAdsenseReviewMode()) {
    return {
      ok: true,
      paused: true,
      reason: "ADSENSE_REVIEW_MODE",
      inserted: 0,
      skipped: 0,
      errors: [] as string[],
      published: [] as Array<{ slug: string; category: string; title: string }>
    };
  }

  const maxNewArticles =
    options.maxNewArticles ?? Number(process.env.OWNER_VOICE_TRENDS_MAX_NEW ?? 5);
  const seeds = await collectTrendSeedsForIngestion({
    maxTrends: options.maxTrends ?? 40,
    geo: options.geo
  });

  const result = {
    ok: true,
    maxNewArticles,
    scanned: seeds.length,
    inserted: 0,
    skipped: 0,
    errors: [] as string[],
    published: [] as Array<{ slug: string; category: string; title: string }>
  };

  for (const seed of seeds) {
    if (result.inserted >= maxNewArticles) {
      break;
    }

    const category = resolveTrendCategory(seed);

    if (!category || !isCoreCategory(category)) {
      result.skipped += 1;
      continue;
    }

    const skipReason = shouldSkipOwnerVoiceTrend(seed, category);

    if (skipReason) {
      result.skipped += 1;
      result.errors.push(`${seed.title}: skipped (${skipReason})`);
      continue;
    }

    const hydratedSeed = await hydrateTrendSeedForIngestion(seed);

    if (await articleExists(hydratedSeed.sourceUrl)) {
      result.skipped += 1;
      continue;
    }

    try {
      let draft: OwnerVoiceTrendArticle | undefined;
      let lastIssues: string[] = [];

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        draft = await writeOwnerVoiceTrendArticle(
          hydratedSeed,
          category,
          attempt > 1 ? lastIssues : undefined
        );
        lastIssues = validateOwnerVoiceTrendDraft(hydratedSeed, draft, category);

        if (lastIssues.length === 0) {
          break;
        }
      }

      if (!draft || lastIssues.length > 0) {
        result.skipped += 1;
        result.errors.push(
          `${hydratedSeed.title}: failed owner-voice validation (${lastIssues.join(", ")})`
        );
        continue;
      }

      const slug = await createUniqueSlug(draft.title);
      const shareId = await createUniqueShareId();
      const sourceImageUrl = await fetchOpenGraphImage(
        hydratedSeed.imageSourceUrl ?? hydratedSeed.sourceUrl
      );
      const imageUrl = getUsableTrendImage(sourceImageUrl ?? hydratedSeed.imageUrl);
      const publishedAt = new Date().toISOString();

      const { data: insertedArticle, error } = await supabase
        .from("articles")
        .insert({
          title: draft.title,
          slug,
          content: draft.content,
          meta_description: draft.meta_description,
          key_takeaways: draft.key_takeaways,
          category,
          source_name: ARTICLE_EDITORIAL_SOURCE_NAME,
          source_url: hydratedSeed.sourceUrl,
          image_url: imageUrl,
          share_id: shareId,
          status: "published",
          published_at: publishedAt
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      result.inserted += 1;
      result.published.push({ slug, category, title: draft.title });

      if (insertedArticle?.id) {
        await enrichArticleMedia({
          articleId: String(insertedArticle.id),
          title: draft.title,
          category,
          metaDescription: draft.meta_description
        });

        await syncLocalizedArticleHeroImage({
          articleId: String(insertedArticle.id),
          currentImageUrl: imageUrl,
          preferMedia: true,
          slug,
          title: draft.title,
          publishedAt
        });

        try {
          await syncArticleInlineImages({
            articleId: String(insertedArticle.id),
            slug,
            title: draft.title,
            category,
            metaDescription: draft.meta_description,
            publishedAt
          });
        } catch (inlineImageError) {
          console.warn(
            `[owner-voice-trends] Inline image sync skipped for ${slug}`,
            inlineImageError instanceof Error ? inlineImageError.message : inlineImageError
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `${hydratedSeed.title}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
}
