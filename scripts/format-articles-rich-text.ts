import { loadLocalEnv } from "../lib/load-env";
import { getOpenAIClient } from "../lib/openai";
import { revalidateSiteCache } from "../lib/revalidate-site";
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
};

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);

  return arg?.slice(prefix.length).trim() || undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function alreadyRich(content: string) {
  return (
    /\*\*[^*]+\*\*/.test(content) &&
    /==[^=]+==/.test(content) &&
    /^>>\s+/m.test(content)
  );
}

async function loadArticles(options: {
  limit: number;
  slug?: string;
  category?: string;
  includeAlreadyRich: boolean;
  includeOthers: boolean;
}) {
  const supabase = getSupabaseClient();
  const fetchLimit = options.includeAlreadyRich
    ? options.limit
    : Math.max(options.limit * 4, 100);

  let query = supabase
    .from("articles")
    .select(
      "id,slug,title,meta_description,content,key_takeaways,category,source_name"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(fetchLimit);

  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  if (options.category) {
    query = query.eq("category", options.category);
  }

  if (!options.includeOthers && !options.category) {
    query = query.neq("category", "others");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const rows = ((data ?? []) as ArticleRow[]).filter((article) =>
    options.includeAlreadyRich ? true : !alreadyRich(article.content)
  );

  return rows.slice(0, options.limit);
}

async function formatArticle(article: ArticleRow) {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "article_rich_text_formatting",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            content: { type: "string" }
          },
          required: ["content"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You are a careful copy editor. Improve scanability with markdown formatting only. Preserve facts, links, citations, source attribution, and meaning. Return only valid JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          article: {
            title: article.title,
            meta_description: article.meta_description,
            category: article.category,
            source_name: article.source_name,
            key_takeaways: article.key_takeaways ?? [],
            content: article.content
          },
          instructions: [
            "Do not change the article's facts, claims, links, source note, or overall structure.",
            "Do not add new statistics, names, products, quotes, citations, or external links.",
            "Keep all existing markdown links exactly valid.",
            "Keep ## and ### headings only; do not add a title/H1 inside content.",
            "Add tasteful emoji to some major ## headings only when it fits naturally. Do not overuse emoji.",
            "Add **bold** emphasis to important terms, tools, risks, decision rules, and metrics.",
            "Add ==highlighted phrases== to 2-5 critical takeaways or warnings.",
            "Add 1-2 standalone callout lines that start with >> for practical tips.",
            "Keep paragraphs short and readable.",
            "Never escape markdown characters with backslashes.",
            "Return the full updated content body."
          ]
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error("OpenAI returned an empty rich formatting response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const content = String(parsed.content ?? "").trim();

  if (!content) {
    throw new Error("OpenAI returned empty formatted content");
  }

  return content;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const includeAlreadyRich = process.argv.includes("--include-rich");
  const includeOthers = process.argv.includes("--include-others");
  const limit = getNumberArg("limit", 20);
  const delayMs = getNumberArg("delay-ms", 2000);
  const slug = getStringArg("slug");
  const category = getStringArg("category");

  const articles = await loadArticles({
    limit,
    slug,
    category,
    includeAlreadyRich,
    includeOthers
  });

  const supabase = getSupabaseClient();
  const pathsToRevalidate: string[] = [];
  const result = {
    dryRun,
    includeOthers,
    checked: articles.length,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    samples: [] as Array<{ slug: string; beforeLength: number; afterLength: number }>
  };

  for (const article of articles) {
    try {
      const content = await formatArticle(article);

      if (content === article.content) {
        result.skipped += 1;
        continue;
      }

      if (dryRun) {
        result.updated += 1;
        result.samples.push({
          slug: article.slug,
          beforeLength: article.content.length,
          afterLength: content.length
        });
      } else {
        const { error } = await supabase
          .from("articles")
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq("id", article.id);

        if (error) {
          throw error;
        }

        result.updated += 1;
        pathsToRevalidate.push(`/${article.category}/${article.slug}`);
        console.log(`[rich-format] updated ${article.slug}`);
      }
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
      console.warn("[rich-format] Revalidate failed", error);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[rich-format] Failed", error);
  process.exitCode = 1;
});
