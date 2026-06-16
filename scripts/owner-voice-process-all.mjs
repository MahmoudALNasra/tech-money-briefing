import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import {
  ARTICLE_EDITORIAL_SOURCE_NAME,
  ARTICLE_ORIGINALITY_INSTRUCTIONS,
  OWNER_VOICE_AI_VOCABULARY_AVOID,
  OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
  OWNER_VOICE_APPROVED_SAMPLES,
  OWNER_VOICE_BANNED_PATTERNS,
  OWNER_VOICE_GOLD_ARTICLE_EXCERPT,
  OWNER_VOICE_PASSED_ARTICLE_EXCERPTS,
  OWNER_VOICE_REWRITE_GUIDE,
  OWNER_VOICE_SKIP_SLUGS,
  detectCorporateTakeaways,
  detectLowBurstiness,
  detectOwnerVoiceTemplateSignals,
  stripGeneratedSourceFooter
} from "../lib/article-attribution.ts";
import { normalizeArticleContent } from "../lib/article-markdown.tsx";
import { loadLocalEnv } from "../lib/load-env.ts";

loadLocalEnv();

const STYLE_EXAMPLE_SLUGS = [
  "best-chatgpt-prompts-for-small-business-owners",
  "how-to-price-a-saas-product-a-practical-formula-for-founders",
  "navigating-regulatory-risks-insights-from-amazon-ceo-s-concerns-on-anthropic-ai-models"
];

const LOG_DIR = "data/owner-voice-runs";
const COMPLETED_LOG = `${LOG_DIR}/completed.jsonl`;
const FAILED_LOG = `${LOG_DIR}/failed.jsonl`;

const MAX_ATTEMPTS = 7;
const MODEL = process.env.OPENAI_REWRITE_MODEL ?? "gpt-4o";
const DELAY_MS = Number(process.env.OWNER_VOICE_DELAY_MS ?? 800);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const onlyOthers = process.argv.includes("--others-only");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function globalPattern(pattern) {
  return new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  );
}

function sanitizeSourceText(content) {
  return OWNER_VOICE_BANNED_PATTERNS.reduce(
    (text, pattern) => text.replace(globalPattern(pattern), " "),
    content
  )
    .replace(/\s{2,}/g, " ")
    .slice(0, 4000);
}

function autoFixTakeaways(takeaways) {
  return takeaways.map((takeaway, index) => {
    if (/\b(I|you|your|don't|not)\b/i.test(takeaway)) {
      return takeaway.trim();
    }

    if (index === 0) {
      return `Do not skip this: ${takeaway.trim()}`;
    }

    if (index === 1) {
      return `You should check this before spending more time: ${takeaway.trim()}`;
    }

    return `I would start here: ${takeaway.trim()}`;
  });
}

function validateDraft(draft) {
  const issues = [
    ...detectOwnerVoiceTemplateSignals(draft.content),
    ...detectCorporateTakeaways(draft.key_takeaways),
    ...detectLowBurstiness(draft.content)
  ];

  const firstPersonCount = (
    draft.content.match(/\bI\b|\bmy\b|\bI would\b|\bI would not\b|\bI wouldn't\b/gi) ??
    []
  ).length;

  if (firstPersonCount < 5) {
    issues.push("not enough first-person voice");
  }

  if (draft.content.length < 400) {
    issues.push("article too short");
  }

  if (/^\s*\d+\.\s/m.test(draft.content)) {
    issues.push("numbered list detected");
  }

  return issues;
}

async function loadStyleExamples() {
  const { data } = await supabase
    .from("articles")
    .select("slug,title,content")
    .in("slug", STYLE_EXAMPLE_SLUGS);

  return (data ?? []).map((article) => ({
    slug: article.slug,
    title: article.title,
    content: article.content
  }));
}

async function loadRemainingArticles() {
  const rows = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    let query = supabase
      .from("articles")
      .select("id,title,slug,meta_description,content,category")
      .eq("status", "published")
      .not("source_name", "ilike", "%Referral%")
      .order("published_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (onlyOthers) {
      query = query.eq("category", "others");
    } else {
      query = query.neq("category", "others");
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const page = data ?? [];
    if (page.length === 0) {
      break;
    }

    rows.push(...page.filter((article) => !OWNER_VOICE_SKIP_SLUGS.includes(article.slug)));
    offset += pageSize;

    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function writeArticle(article, styleExamples, retryFeedback) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.56,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "owner_voice_article",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            meta_description: { type: "string" },
            content: { type: "string" },
            key_takeaways: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            }
          },
          required: ["title", "meta_description", "content", "key_takeaways"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You write Tech Revenue Brief articles in first person as a skeptical site owner. Match the detector-passed examples exactly in rhythm and plainness. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Write a new article in the same voice as completeStyleExamples.",
          completeStyleExamples: styleExamples,
          goldStandardExcerpt: OWNER_VOICE_GOLD_ARTICLE_EXCERPT,
          detectorPassedExcerpts: OWNER_VOICE_PASSED_ARTICLE_EXCERPTS,
          approvedVoiceSamples: OWNER_VOICE_APPROVED_SAMPLES,
          aiVocabularyToAvoid: OWNER_VOICE_AI_VOCABULARY_AVOID,
          retryFeedback,
          rules: [
            ...ARTICLE_ORIGINALITY_INSTRUCTIONS,
            ...OWNER_VOICE_REWRITE_GUIDE,
            ...OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
            "Open with 'I would not...' or similar skeptical first-person reasoning.",
            "Use specific ## headings, one optional ## Quick Answer, no FAQ, no summary closer.",
            "550-800 words. Mix short and long sentences.",
            "Each key_takeaway must include I, you, your, don't, or not.",
            "Do not reuse the old article wording or structure."
          ],
          articleContext: {
            slug: article.slug,
            category: article.category,
            oldTitle: article.title,
            oldMetaDescription: article.meta_description,
            topicSource: sanitizeSourceText(article.content)
          }
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("empty model response");
  }

  const parsed = JSON.parse(raw);
  parsed.key_takeaways = autoFixTakeaways(parsed.key_takeaways);
  parsed.content = normalizeArticleContent(stripGeneratedSourceFooter(parsed.content));
  parsed.title = parsed.title.trim();
  parsed.meta_description = parsed.meta_description.trim().slice(0, 180);

  return parsed;
}

async function processArticle(article, styleExamples) {
  let lastIssues = [];
  let draft;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    draft = await writeArticle(
      article,
      styleExamples,
      attempt > 1 ? lastIssues : undefined
    );
    lastIssues = validateDraft(draft);

    if (lastIssues.length === 0) {
      return draft;
    }

    console.warn(
      `[process-all] ${article.slug} attempt ${attempt}: ${lastIssues.join(", ")}`
    );
  }

  throw new Error(lastIssues.join(", "));
}

async function run() {
  mkdirSync(dirname(COMPLETED_LOG), { recursive: true });

  const styleExamples = await loadStyleExamples();
  const articles = await loadRemainingArticles();

  console.log(
    `[process-all] loaded ${articles.length} article(s)${onlyOthers ? " [others]" : ""}`
  );

  let updated = 0;
  let failed = 0;

  for (const [index, article] of articles.entries()) {
    console.log(`[process-all] ${index + 1}/${articles.length} ${article.slug}`);

    try {
      const draft = await processArticle(article, styleExamples);
      const { error } = await supabase
        .from("articles")
        .update({
          title: draft.title,
          meta_description: draft.meta_description,
          content: draft.content,
          key_takeaways: draft.key_takeaways,
          source_name: ARTICLE_EDITORIAL_SOURCE_NAME,
          updated_at: new Date().toISOString()
        })
        .eq("id", article.id);

      if (error) {
        throw error;
      }

      updated += 1;
      appendFileSync(
        COMPLETED_LOG,
        `${JSON.stringify({ slug: article.slug, category: article.category })}\n`
      );
      console.log(`[process-all] updated ${article.slug}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      appendFileSync(
        FAILED_LOG,
        `${JSON.stringify({ slug: article.slug, category: article.category, error: message })}\n`
      );
      console.error(`[process-all] failed ${article.slug}: ${message}`);
    }

    if (DELAY_MS > 0 && index < articles.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(
    JSON.stringify({ checked: articles.length, updated, failed, onlyOthers }, null, 2)
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[process-all] fatal", error);
  process.exitCode = 1;
});
