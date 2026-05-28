import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

const weakTitlePatterns = [
  "techcrunch disrupt",
  "startup battlefield",
  "early bird",
  "ticket",
  "tickets"
];

function shouldDraft(article: {
  title: string;
  category: string;
  source_name: string;
}) {
  const title = article.title.toLowerCase();
  const sourceName = article.source_name.toLowerCase();

  if (article.category === "others" && sourceName.includes("google trends")) {
    return true;
  }

  return weakTitlePatterns.some((pattern) => title.includes(pattern));
}

async function draftWeakArticles() {
  const dryRun = process.argv.includes("--dry-run");
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,slug,category,source_name,status")
    .eq("status", "published")
    .limit(1000);

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const candidates = (data ?? []).filter((article) =>
    shouldDraft({
      title: String(article.title),
      category: String(article.category),
      source_name: String(article.source_name)
    })
  );

  if (!dryRun && candidates.length > 0) {
    const ids = candidates.map((article) => article.id);
    const { error: updateError } = await supabase
      .from("articles")
      .update({
        status: "draft",
        updated_at: new Date().toISOString()
      })
      .in("id", ids);

    if (updateError) {
      throw new Error(`Failed to draft weak articles: ${updateError.message}`);
    }

    try {
      await revalidateSiteCache({
        paths: ["/"],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[adsense-cleanup] Revalidate failed", error);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        checked: data?.length ?? 0,
        drafted: dryRun ? 0 : candidates.length,
        candidates: candidates.map((article) => ({
          title: article.title,
          slug: article.slug,
          category: article.category,
          source_name: article.source_name
        }))
      },
      null,
      2
    )
  );
}

draftWeakArticles().catch((error) => {
  console.error("[adsense-cleanup] Failed", error);
  process.exitCode = 1;
});
