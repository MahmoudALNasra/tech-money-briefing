import { enrichArticleMedia, getArticleMedia } from "../lib/article-media";
import { getSupabaseClient } from "../lib/supabase";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { isYouTubeQuotaError } from "../lib/youtube";

loadLocalEnv();

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  meta_description: string;
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

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadArticles() {
  const supabase = getSupabaseClient();
  const limit = getNumberArg("limit", 30);
  const slug = getStringArg("slug");
  const category = getStringArg("category");
  let query = supabase
    .from("articles")
    .select("id,title,slug,category,meta_description")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (slug) {
    query = query.eq("slug", slug).limit(1);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  return (data ?? []) as ArticleRow[];
}

async function run() {
  const replaceExisting = hasFlag("replace");
  const stopOnQuota = hasFlag("stop-on-quota");
  const delayMs = getNumberArg("delay-ms", 0);
  const articles = await loadArticles();
  const result = {
    checked: articles.length,
    updated: 0,
    skipped: 0,
    quotaStopped: false,
    errors: [] as string[]
  };

  for (const article of articles) {
    try {
      const existing = await getArticleMedia(article.id);

      if (existing.length > 0 && !replaceExisting) {
        result.skipped += 1;
        continue;
      }

      const mediaResult = await enrichArticleMedia({
        articleId: article.id,
        title: article.title,
        category: article.category,
        metaDescription: article.meta_description,
        throwOnQuota: stopOnQuota
      });

      if (mediaResult.inserted > 0) {
        result.updated += 1;
        console.log(
          `[article-media] added ${mediaResult.inserted} videos for ${article.slug}`
        );
      } else {
        result.skipped += 1;
      }

      if (delayMs > 0) {
        console.log(`[article-media] waiting ${delayMs}ms before next search`);
        await sleep(delayMs);
      }
    } catch (error) {
      if (stopOnQuota && isYouTubeQuotaError(error)) {
        result.quotaStopped = true;
        console.warn("[article-media] Stopping because YouTube quota is exhausted");
        break;
      }

      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (result.updated > 0) {
    try {
      await revalidateSiteCache({
        paths: [
          "/",
          "/others",
          ...articles.map((article) => `/${article.category}/${article.slug}`)
        ],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn(
        "[article-media] Backfill succeeded but revalidate failed",
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
  console.error("[article-media] Backfill failed", error);
  process.exitCode = 1;
});
