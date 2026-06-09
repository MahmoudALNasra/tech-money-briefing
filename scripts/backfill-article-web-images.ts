import { enrichArticleWebImages } from "../lib/article-web-images";
import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

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

  return arg?.slice(prefix.length).trim() || undefined;
}

async function run() {
  const supabase = getSupabaseClient();
  const limit = getNumberArg("limit", 20);
  const imageLimit = getNumberArg("images", 3);
  const slug = getStringArg("slug");
  const category = getStringArg("category");

  let query = supabase
    .from("articles")
    .select("id,title,slug,category,meta_description")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (slug) {
    query = query.eq("slug", slug);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const result = {
    checked: data?.length ?? 0,
    inserted: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of (data ?? []) as ArticleRow[]) {
    try {
      const imageResult = await enrichArticleWebImages({
        articleId: article.id,
        title: article.title,
        category: article.category,
        metaDescription: article.meta_description,
        limit: imageLimit
      });

      result.inserted += imageResult.inserted;
      result.skipped += imageResult.skipped;
      console.log(`[article:web-images] ${article.slug}: inserted ${imageResult.inserted}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[article:web-images] Failed", error);
  process.exitCode = 1;
});
