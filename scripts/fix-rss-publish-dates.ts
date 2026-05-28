import { loadLocalEnv } from "../lib/load-env";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function fixRssPublishDates() {
  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,title,published_at,created_at,source_name")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const toFix = (data ?? []).filter((row) => {
    const publishedAt = row.published_at ? new Date(String(row.published_at)).getTime() : 0;
    const createdAt = row.created_at ? new Date(String(row.created_at)).getTime() : 0;

    return createdAt > 0 && publishedAt > 0 && createdAt - publishedAt > 60 * 60 * 1000;
  });

  let updated = 0;

  for (const article of toFix) {
    const { error: updateError } = await supabase
      .from("articles")
      .update({
        published_at: String(article.created_at),
        updated_at: new Date().toISOString()
      })
      .eq("id", article.id);

    if (updateError) {
      throw updateError;
    }

    updated += 1;
    console.log(`[fix-rss-dates] ${article.slug}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checked: data?.length ?? 0,
        updated
      },
      null,
      2
    )
  );
}

fixRssPublishDates().catch((error) => {
  console.error("[fix-rss-dates] Failed", error);
  process.exitCode = 1;
});
