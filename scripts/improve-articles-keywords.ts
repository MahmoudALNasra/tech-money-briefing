import { loadLocalEnv } from "../lib/load-env";
import { getOpenAIClient } from "../lib/openai";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { runKeywordResearch } from "../lib/keyword-research";
import { getStaticInternalLinksForText } from "../lib/internal-links";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  key_takeaways: string[] | null;
  category: string;
  source_name: string;
  source_url: string;
};

type ImprovedArticle = {
  title: string;
  meta_description: string;
  content: string;
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

  return arg?.slice(prefix.length).trim() || undefined;
}

function hasSection(content: string, heading: string) {
  const pattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "im");
  return pattern.test(content);
}

function needsImprovement(article: ArticleRow) {
  const meta = article.meta_description.trim();
  const title = article.title.trim();
  const content = article.content;

  if (meta.length < 80 || meta.length > 160) {
    return true;
  }

  if (!hasSection(content, "Quick Answer")) {
    return true;
  }

  if (!hasSection(content, "FAQ")) {
    return true;
  }

  if (title.length < 20) {
    return true;
  }

  return false;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertSection(content: string, heading: string, body: string) {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return content;
  }

  const section = `## ${heading}\n\n${trimmedBody}`;
  const pattern = new RegExp(
    `^##\\s+${escapeRegExp(heading)}\\b[\\s\\S]*?(?=^##\\s+|\\Z)`,
    "im"
  );

  if (pattern.test(content)) {
    return content.replace(pattern, section);
  }

  const firstHeading = content.search(/^##\s+/m);
  if (firstHeading > 0) {
    return `${content.slice(0, firstHeading).trimEnd()}\n\n${section}\n\n${content.slice(firstHeading).trimStart()}`;
  }

  return `${content.trimEnd()}\n\n${section}`;
}

function mergeConservativeContent(
  original: string,
  quickAnswer: string,
  faqSection: string
) {
  let content = original;
  content = upsertSection(content, "Quick Answer", quickAnswer);
  content = upsertSection(content, "FAQ", faqSection);
  return content;
}

async function loadArticles(options: {
  category?: string;
  excludeReferrals: boolean;
  slug?: string;
  onlyMissingStructure: boolean;
  limit: number;
}) {
  const supabase = getSupabaseClient();
  const fetchLimit = options.onlyMissingStructure
    ? Math.max(options.limit * 5, 200)
    : options.limit;

  let query = supabase
    .from("articles")
    .select(
      "id,slug,title,meta_description,content,key_takeaways,category,source_name,source_url"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(fetchLimit);

  if (options.category) {
    query = query.eq("category", options.category);
  }

  if (options.excludeReferrals) {
    query = query.not("source_name", "ilike", "%Referral%");
  }

  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  let rows = (data ?? []) as ArticleRow[];

  if (options.onlyMissingStructure) {
    rows = rows.filter(needsImprovement);
  }

  return rows.slice(0, options.limit);
}

async function improveArticle(
  article: ArticleRow,
  options: { rewriteBody: boolean }
): Promise<ImprovedArticle> {
  const keywordPlan = await runKeywordResearch({
    seed: article.title,
    category: article.category,
    hints: {
      brand: article.source_name,
      isReferral: article.source_name.includes("Referral")
    }
  });

  const internalLinks = getStaticInternalLinksForText(
    [article.title, article.meta_description, article.category].join(" "),
    4
  );

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: options.rewriteBody
          ? "article_seo_full_rewrite"
          : "article_seo_conservative",
        strict: true,
        schema: options.rewriteBody
          ? {
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
          : {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                meta_description: { type: "string" },
                quick_answer: { type: "string" },
                faq_section: { type: "string" },
                key_takeaways: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string" }
                }
              },
              required: [
                "title",
                "meta_description",
                "quick_answer",
                "faq_section",
                "key_takeaways"
              ]
            }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You improve published articles for SEO without making them spammy. Return only valid JSON. Preserve factual meaning. Do not invent facts."
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: options.rewriteBody
            ? [
                "Improve title and meta_description for search intent using the keyword plan.",
                "Rewrite content to add or improve ## Quick Answer, ## FAQ, and clearer structure.",
                "Weave primary keyword and variants naturally into title, opening, headings, and FAQ.",
                "Use misspellings only in FAQ or one short sentence.",
                "Add 2-3 natural internal markdown links inside paragraphs, headings, or useful list items when relevant. Do not add a separate related-links section.",
                "Keep source citation at the end if present.",
                "meta_description must be 120-155 characters.",
                "Generate exactly 3 key_takeaways."
              ]
            : [
                "Improve title and meta_description for search intent using the keyword plan.",
                "Return quick_answer and faq_section as markdown body text only (no ## heading lines).",
                "Do not summarize or replace the rest of the article; those fields are merged server-side.",
                "Weave primary keyword and variants into title, meta, FAQ questions, and quick_answer.",
                "Use misspellings only in FAQ.",
                "Add 2-3 natural internal markdown links in FAQ or quick_answer when clearly helpful. Do not add a separate related-links section.",
                "meta_description must be 120-155 characters.",
                "Generate exactly 3 key_takeaways from existing takeaways or article theme."
              ],
          keywordPlan,
          suggestedInternalLinks: internalLinks,
          current: {
            title: article.title,
            meta_description: article.meta_description,
            key_takeaways: article.key_takeaways ?? [],
            content: options.rewriteBody
              ? article.content
              : article.content.slice(0, 6000)
          }
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty SEO improvement response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  let content = article.content;

  if (options.rewriteBody) {
    content = String(parsed.content ?? "").trim() || article.content;
  } else {
    content = mergeConservativeContent(
      article.content,
      String(parsed.quick_answer ?? ""),
      String(parsed.faq_section ?? "")
    );
  }

  return {
    title: String(parsed.title ?? "").trim() || article.title,
    meta_description:
      String(parsed.meta_description ?? "").trim() || article.meta_description,
    content,
    key_takeaways: Array.isArray(parsed.key_takeaways)
      ? parsed.key_takeaways.map((v) => String(v).trim()).filter(Boolean).slice(0, 3)
      : (article.key_takeaways ?? []).slice(0, 3)
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const replaceBody = process.argv.includes("--replace");
  const category = getStringArg("category");
  const slug = getStringArg("slug");
  const limit = getNumberArg("limit", 20);
  const delayMs = getNumberArg("delay-ms", 0);
  const excludeReferrals = !process.argv.includes("--include-referrals");
  const onlyMissing = process.argv.includes("--only-missing");

  const articles = await loadArticles({
    category,
    slug,
    excludeReferrals,
    onlyMissingStructure: onlyMissing,
    limit
  });

  const result = {
    dryRun,
    replaceBody,
    category: category ?? "all",
    checked: articles.length,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    samples: [] as Array<{ slug: string; title: string; metaLen: number }>
  };

  const supabase = getSupabaseClient();
  const pathsToRevalidate: string[] = [];

  for (const article of articles) {
    try {
      const improved = await improveArticle(article, { rewriteBody: replaceBody });

      const titleChanged = improved.title !== article.title;
      const metaChanged =
        improved.meta_description !== article.meta_description;
      const contentChanged = improved.content !== article.content;
      const takeawaysChanged =
        JSON.stringify(improved.key_takeaways) !==
        JSON.stringify(article.key_takeaways ?? []);

      if (!titleChanged && !metaChanged && !contentChanged && !takeawaysChanged) {
        result.skipped += 1;
        continue;
      }

      if (dryRun) {
        result.samples.push({
          slug: article.slug,
          title: improved.title,
          metaLen: improved.meta_description.length
        });
        result.updated += 1;
        continue;
      }

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

      pathsToRevalidate.push(`/${article.category}/${article.slug}`);
      result.updated += 1;
      console.log(
        `[article-keywords] updated ${article.slug} (meta ${article.meta_description.length} -> ${improved.meta_description.length})`
      );
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (!dryRun && pathsToRevalidate.length > 0) {
    try {
      await revalidateSiteCache({
        paths: [...new Set(pathsToRevalidate)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[article-keywords] Revalidate failed", error);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[article-keywords] Failed", error);
  process.exitCode = 1;
});
