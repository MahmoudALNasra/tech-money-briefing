import { loadLocalEnv } from "../lib/load-env";
import { getOpenAIClient } from "../lib/openai";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  key_takeaways: string[] | null;
  source_name: string;
  source_url: string;
};

type ImprovedArticle = {
  title: string;
  content: string;
  meta_description: string;
  key_takeaways: string[];
};

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length).trim() || null;
}

function getTrendQuery(sourceUrl: string, fallback: string) {
  try {
    const parsed = new URL(sourceUrl);
    const query = parsed.searchParams.get("q")?.trim();

    return query || fallback;
  } catch {
    return fallback;
  }
}

function classifyIntent(article: ArticleRow) {
  const text = `${article.title} ${article.source_url}`.toLowerCase();

  if (/\b(open|closed|hours|today|memorial day|holiday)\b/.test(text)) {
    return "hours-and-status";
  }

  if (/\b(vs|game|finals|world cup|mlb|nba|nhl|fifa|athletics|mariners|knicks|dodgers|rockies)\b/.test(text)) {
    return "sports-context";
  }

  if (/\b(payment|social security|irs|deadline|deposit|issued)\b/.test(text)) {
    return "payment-deadline";
  }

  if (/\b(meaning|what is|encyclical|ai|pope|ferrari|luce)\b/.test(text)) {
    return "explainer";
  }

  return "news-explainer";
}

async function loadArticles() {
  const slug = getStringArg("slug");
  const limit = getNumberArg("limit", 12);
  let query = supabase
    .from("articles")
    .select(
      "id,title,slug,meta_description,content,key_takeaways,source_name,source_url"
    )
    .eq("category", "others")
    .eq("status", "published")
    .ilike("source_name", "Google Trends%")
    .order("published_at", { ascending: false });

  query = slug ? query.eq("slug", slug) : query.limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load trend articles: ${error.message}`);
  }

  return (data ?? []) as ArticleRow[];
}

async function improveArticle(article: ArticleRow): Promise<ImprovedArticle> {
  const targetQuery = getTrendQuery(article.source_url, article.title);
  const searchIntent = classifyIntent(article);
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.35,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "improved_trend_article",
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
          "You are a senior SEO editor. Improve existing Google Trends articles so they satisfy search intent, answer the query directly, and avoid unsupported claims. Return only valid JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: [
            "Rewrite and expand this already-published trend article without changing its topic.",
            "Keep the article factual and cautious. If the source context is thin, explain how readers can verify details instead of inventing facts.",
            "Do not include a title line inside content.",
            "Open content with a 35-60 word direct-answer paragraph that naturally includes the target query or closest phrase.",
            "Use 650-900 words when the topic supports it. Use short paragraphs.",
            "Include these sections where they fit: ## Quick Answer, ## Why Searches Are Spiking, ## What Readers Should Know, ## How To Verify Details, ## What To Watch Next, ## FAQ.",
            "Under ## FAQ include 3-4 question-style ### headings with concise answers.",
            "Use related search phrases naturally in headings and answers, not as a keyword list.",
            "End content with exactly: Source: Google Trends.",
            "Generate exactly 3 key_takeaways."
          ],
          targetQuery,
          searchIntent,
          existingTitle: article.title,
          existingMetaDescription: article.meta_description,
          existingContent: article.content,
          existingKeyTakeaways: article.key_takeaways,
          sourceName: article.source_name,
          sourceUrl: article.source_url
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error(`OpenAI returned empty content for ${article.slug}`);
  }

  const parsed = JSON.parse(raw) as ImprovedArticle;

  if (
    !parsed.title ||
    !parsed.content ||
    !parsed.meta_description ||
    !Array.isArray(parsed.key_takeaways) ||
    parsed.key_takeaways.length !== 3
  ) {
    throw new Error(`Improved article response missed fields for ${article.slug}`);
  }

  return {
    title: parsed.title.trim(),
    content: parsed.content.trim(),
    meta_description: parsed.meta_description.trim(),
    key_takeaways: parsed.key_takeaways.map((takeaway) => takeaway.trim())
  };
}

async function run() {
  const articles = await loadArticles();
  const result = {
    checked: articles.length,
    updated: 0,
    errors: [] as string[]
  };

  for (const article of articles) {
    try {
      const improved = await improveArticle(article);
      const { error } = await supabase
        .from("articles")
        .update({
          title: improved.title,
          content: improved.content,
          meta_description: improved.meta_description,
          key_takeaways: improved.key_takeaways,
          updated_at: new Date().toISOString()
        })
        .eq("id", article.id);

      if (error) {
        throw error;
      }

      result.updated += 1;
      console.log(`[improve-trends] updated ${article.slug}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (result.updated > 0) {
    try {
      await revalidateSiteCache({
        paths: ["/", "/others", ...articles.map((article) => `/others/${article.slug}`)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn(
        "[improve-trends] Updated articles but cache revalidate failed",
        error
      );
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[improve-trends] Failed", error);
  process.exitCode = 1;
});
