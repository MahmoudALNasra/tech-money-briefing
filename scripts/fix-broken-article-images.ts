import { loadLocalEnv } from "../lib/load-env";
import { isImageUrlUsable, resolveArticleHeroImage } from "../lib/article-images";
import type { ArticleMedia } from "../lib/types";
import { getSupabaseClient } from "../lib/supabase";
import { revalidateSiteCache } from "../lib/revalidate-site";

loadLocalEnv();

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
  const dryRun = process.argv.includes("--dry-run");
  const limit = getNumberArg("limit", 250);
  const slug = getStringArg("slug");
  const supabase = getSupabaseClient();

  let query = supabase
    .from("articles")
    .select("id,slug,category,image_url")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (slug) {
    query = query.eq("slug", slug);
  }

  const { data: articles, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const result = {
    dryRun,
    checked: articles?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    samples: [] as Array<{ slug: string; from: string | null; to: string }>
  };

  const pathsToRevalidate: string[] = [];

  for (const article of articles ?? []) {
    try {
      const currentUrl = article.image_url ? String(article.image_url) : null;
      const currentUsable = await isImageUrlUsable(currentUrl);

      if (currentUsable) {
        result.skipped += 1;
        continue;
      }

      const { data: media, error: mediaError } = await supabase
        .from("article_media")
        .select("provider,provider_id,thumbnail_url,position")
        .eq("article_id", article.id)
        .order("position", { ascending: true });

      if (mediaError) {
        throw new Error(mediaError.message);
      }

      const resolved = await resolveArticleHeroImage({
        image_url: currentUrl,
        media: (media ?? []).map(
          (row) =>
            ({
              id: String(row.provider_id),
              article_id: String(article.id),
              provider: "youtube",
              provider_id: String(row.provider_id),
              title: "",
              thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
              url: "",
              position: Number(row.position ?? 0)
            }) satisfies ArticleMedia
        )
      });

      if (!resolved || !(await isImageUrlUsable(resolved))) {
        result.skipped += 1;
        continue;
      }

      if (dryRun) {
        result.updated += 1;
        result.samples.push({
          slug: article.slug,
          from: currentUrl,
          to: resolved
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({ image_url: resolved, updated_at: new Date().toISOString() })
        .eq("id", article.id);

      if (updateError) {
        throw updateError;
      }

      result.updated += 1;
      pathsToRevalidate.push(`/${article.category}/${article.slug}`);
      console.log(`[fix-images] ${article.slug} -> ${resolved}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!dryRun && pathsToRevalidate.length > 0) {
    try {
      await revalidateSiteCache({
        paths: [...new Set(pathsToRevalidate)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[fix-images] Revalidate failed", error);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[fix-images] Failed", error);
  process.exitCode = 1;
});
