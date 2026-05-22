import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

async function backfillImages() {
  const { fetchOpenGraphImage } = await import("../lib/ingestion");
  const { supabase } = await import("../lib/supabase");

  const { data, error } = await supabase
    .from("articles")
    .select("id,title,source_url")
    .is("image_url", null)
    .limit(50);

  if (error) {
    throw new Error(`Failed to load articles without images: ${error.message}`);
  }

  let updated = 0;
  let skipped = 0;

  for (const article of data ?? []) {
    const imageUrl = await fetchOpenGraphImage(article.source_url);

    if (!imageUrl) {
      skipped += 1;
      console.log(`[image] skipped: ${article.title}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("articles")
      .update({ image_url: imageUrl })
      .eq("id", article.id);

    if (updateError) {
      throw new Error(`Failed to update ${article.id}: ${updateError.message}`);
    }

    updated += 1;
    console.log(`[image] updated: ${article.title}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checked: data?.length ?? 0,
        updated,
        skipped
      },
      null,
      2
    )
  );
}

backfillImages().catch((error) => {
  console.error("[image] Failed", error);
  process.exitCode = 1;
});
