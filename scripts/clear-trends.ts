import { loadLocalEnv } from "../lib/load-env";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function clearTrendArticles() {
  const { count, error: countError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("category", "others")
    .ilike("source_name", "Google Trends%");

  if (countError) {
    throw new Error(`Failed to count trend articles: ${countError.message}`);
  }

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("category", "others")
    .ilike("source_name", "Google Trends%");

  if (error) {
    throw new Error(`Failed to clear trend articles: ${error.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        deleted: count ?? 0,
        category: "others",
        source: "Google Trends"
      },
      null,
      2
    )
  );
}

clearTrendArticles().catch((error) => {
  console.error("[trends:clear] Failed", error);
  process.exitCode = 1;
});
