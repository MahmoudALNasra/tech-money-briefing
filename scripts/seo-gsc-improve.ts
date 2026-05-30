import { loadLocalEnv } from "../lib/load-env";
import { improvePublishedArticleForGsc } from "../lib/gsc-article-improve";
import { fetchGscOpportunities } from "../lib/gsc-seo";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = getNumberArg("limit", 10);
  const delayMs = getNumberArg("delay-ms", 2000);
  const days = getNumberArg("days", Number(process.env.GSC_LOOKBACK_DAYS ?? 28));

  const opportunities = (await fetchGscOpportunities({ days }))
    .filter((op) => op.type === "improve_existing" && op.article)
    .slice(0, limit);

  const supabase = getSupabaseClient();
  const result = {
    dryRun,
    days,
    queued: opportunities.length,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    samples: [] as Array<{ slug: string; query: string; title: string }>
  };

  const pathsToRevalidate: string[] = [];

  for (const opportunity of opportunities) {
    const articleRef = opportunity.article!;

    try {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id,slug,title,meta_description,content,key_takeaways,category"
        )
        .eq("id", articleRef.id)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        result.skipped += 1;
        continue;
      }

      const improved = await improvePublishedArticleForGsc(
        data as Parameters<typeof improvePublishedArticleForGsc>[0],
        opportunity.query
      );

      const unchanged =
        improved.title === data.title &&
        improved.meta_description === data.meta_description &&
        improved.content === data.content &&
        JSON.stringify(improved.key_takeaways) ===
          JSON.stringify(data.key_takeaways ?? []);

      if (unchanged) {
        result.skipped += 1;
        continue;
      }

      if (dryRun) {
        result.samples.push({
          slug: data.slug,
          query: opportunity.query,
          title: improved.title
        });
        result.updated += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({
          title: improved.title,
          content: improved.content,
          meta_description: improved.meta_description,
          key_takeaways: improved.key_takeaways,
          updated_at: new Date().toISOString()
        })
        .eq("id", data.id);

      if (updateError) {
        throw updateError;
      }

      pathsToRevalidate.push(`/${data.category}/${data.slug}`);
      result.updated += 1;
      console.log(
        `[gsc-improve] updated ${data.slug} for query "${opportunity.query}"`
      );
    } catch (error) {
      result.errors.push(
        `${articleRef.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (!dryRun && pathsToRevalidate.length > 0) {
    try {
      await revalidateSiteCache({
        paths: [...new Set(pathsToRevalidate)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[gsc-improve] Revalidate failed", error);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[gsc-improve] Failed", error);
  process.exitCode = 1;
});
