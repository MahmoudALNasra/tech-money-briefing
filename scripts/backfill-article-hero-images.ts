import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";
import { highQualityYouTubeThumbnail } from "../lib/youtube-thumbnails";

loadLocalEnv();

type ArticleRow = {
  id: string;
  slug: string;
  category: string;
  image_url: string | null;
};

type MediaRow = {
  provider_id: string;
  thumbnail_url: string | null;
};

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function run() {
  const supabase = getSupabaseClient();
  const limit = getNumberArg("limit", 100);
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id,slug,category,image_url")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const result = {
    checked: articles?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of (articles ?? []) as ArticleRow[]) {
    try {
      if (article.image_url && !article.image_url.includes("ytimg.com")) {
        result.skipped += 1;
        continue;
      }

      const { data: media, error: mediaError } = await supabase
        .from("article_media")
        .select("provider_id,thumbnail_url")
        .eq("article_id", article.id)
        .not("thumbnail_url", "is", null)
        .order("position", { ascending: true })
        .limit(1);

      if (mediaError) {
        throw new Error(mediaError.message);
      }

      const firstMedia = ((media ?? []) as MediaRow[])[0];
      const thumbnailUrl = firstMedia?.provider_id
        ? highQualityYouTubeThumbnail(firstMedia.provider_id)
        : firstMedia?.thumbnail_url;

      if (!thumbnailUrl) {
        result.skipped += 1;
        continue;
      }

      if (!(await isUsableImage(thumbnailUrl))) {
        result.skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({ image_url: thumbnailUrl })
        .eq("id", article.id)
        .select("id")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      result.updated += 1;
      console.log(`[hero-images] added HD thumbnail hero for ${article.slug}`);
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

async function isUsableImage(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000)
    });

    return response.ok;
  } catch {
    return false;
  }
}

run().catch((error) => {
  console.error("[hero-images] Backfill failed", error);
  process.exitCode = 1;
});
