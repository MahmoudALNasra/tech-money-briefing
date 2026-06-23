import { syncArticleInlineImages } from "../lib/article-inline-images";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  meta_description: string;
  published_at: string | null;
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

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadArticles(input: {
  limit: number;
  offset: number;
  slug?: string;
  category?: string;
}) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("articles")
    .select("id,title,slug,category,meta_description,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.slug) {
    query = query.eq("slug", input.slug);
  }

  if (input.category) {
    query = query.eq("category", input.category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  return (data ?? []) as ArticleRow[];
}

async function run() {
  const fetchAll = hasFlag("all");
  const batchSize = getNumberArg("limit", fetchAll ? 25 : 20);
  const imageLimit = getNumberArg("images", 3);
  const delayMs = getNumberArg("delay-ms", fetchAll ? 400 : 0);
  const slug = getStringArg("slug");
  const category = getStringArg("category");

  const result = {
    checked: 0,
    enriched: 0,
    localized: 0,
    alreadyLocal: 0,
    skipped: 0,
    errors: [] as string[]
  };

  const pathsToRevalidate = new Set<string>(["/"]);
  let offset = 0;

  while (true) {
    const articles = await loadArticles({
      limit: batchSize,
      offset,
      slug,
      category
    });

    if (articles.length === 0) {
      break;
    }

    for (const article of articles) {
      result.checked += 1;

      try {
        const syncResult = await syncArticleInlineImages({
          articleId: article.id,
          slug: article.slug,
          title: article.title,
          category: article.category,
          metaDescription: article.meta_description,
          publishedAt: article.published_at,
          limit: imageLimit
        });

        if (syncResult.action === "enriched") {
          result.enriched += 1;
          pathsToRevalidate.add(`/${article.category}/${article.slug}`);
          console.log(
            `[article:inline-images] ${article.slug}: enriched ${syncResult.inserted} local image(s)`
          );
        } else if (syncResult.action === "localized") {
          result.localized += 1;
          pathsToRevalidate.add(`/${article.category}/${article.slug}`);
          console.log(
            `[article:inline-images] ${article.slug}: localized ${syncResult.localized} image(s)`
          );
        } else {
          result.alreadyLocal += 1;
          result.skipped += syncResult.skipped;
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

    if (!fetchAll || slug || category || articles.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  if (result.enriched > 0 || result.localized > 0) {
    try {
      await revalidateSiteCache({
        paths: [...pathsToRevalidate],
        tags: ["articles"]
      });
    } catch (revalidateError) {
      console.warn("[article:inline-images] Cache revalidate failed", revalidateError);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[article:inline-images] Failed", error);
  process.exitCode = 1;
});
