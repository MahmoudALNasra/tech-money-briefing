import { fetchOpenGraphImage } from "../lib/ingestion";
import { loadLocalEnv } from "../lib/load-env";
import { supabase } from "../lib/supabase";

loadLocalEnv();

function isGoogleThumbnail(url: string | null) {
  return Boolean(url?.includes("encrypted-tbn"));
}

async function backfillTrendImages() {
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,source_url,image_url")
    .eq("category", "others")
    .ilike("source_name", "Google Trends%");

  if (error) {
    throw new Error(`Failed to load trend articles: ${error.message}`);
  }

  const result = {
    checked: data?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of data ?? []) {
    if (!isGoogleThumbnail(article.image_url)) {
      result.skipped += 1;
      continue;
    }

    try {
      const imageUrl = await fetchOpenGraphImage(article.source_url);

      if (!imageUrl || imageUrl === article.image_url) {
        result.skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({ image_url: imageUrl })
        .eq("id", article.id);

      if (updateError) {
        throw updateError;
      }

      result.updated += 1;
    } catch (error) {
      result.errors.push(
        `${article.title}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

backfillTrendImages().catch((error) => {
  console.error("[trends:backfill-images] Failed", error);
  process.exitCode = 1;
});
