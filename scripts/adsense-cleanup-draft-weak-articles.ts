import {
  getAdsenseTargetPublishedCount,
  pickArticlesToDraftForAdsenseCorpus,
  scoreArticleForAdsenseRetention
} from "../lib/adsense-readiness";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

function getNumberArg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) {
    return undefined;
  }

  const value = Number(match.slice(prefix.length));
  return Number.isFinite(value) ? value : undefined;
}

async function loadPublishedArticles() {
  const pageSize = 500;
  const rows: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    source_name: string;
    source_url: string | null;
    image_url: string | null;
    content: string;
    published_at: string | null;
  }> = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id,title,slug,category,source_name,source_url,image_url,content,published_at"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to load articles: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function draftWeakArticles() {
  const dryRun = process.argv.includes("--dry-run");
  const targetCount = getNumberArg("target") ?? getAdsenseTargetPublishedCount();
  const articles = await loadPublishedArticles();
  const plan = pickArticlesToDraftForAdsenseCorpus(articles, targetCount);

  if (!dryRun && plan.allToDraft.length > 0) {
    const ids = plan.allToDraft.map((article) => article.id);

    for (let offset = 0; offset < ids.length; offset += 100) {
      const batch = ids.slice(offset, offset + 100);
      const { error: updateError } = await supabase
        .from("articles")
        .update({
          status: "draft",
          updated_at: new Date().toISOString()
        })
        .in("id", batch);

      if (updateError) {
        throw new Error(`Failed to draft articles: ${updateError.message}`);
      }
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

  const categoryBreakdown = (items: typeof plan.keep) =>
    Object.entries(
      items.reduce<Record<string, number>>((counts, article) => {
        counts[article.category] = (counts[article.category] ?? 0) + 1;
        return counts;
      }, {})
    ).sort((left, right) => right[1] - left[1]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        targetCount,
        checked: articles.length,
        drafted: dryRun ? 0 : plan.allToDraft.length,
        publishedAfter: plan.publishedAfter,
        breakdown: {
          mustDraft: plan.mustDraft.length,
          capDraft: plan.capDraft.length,
          keptByCategory: categoryBreakdown(plan.keep)
        },
        keptSample: plan.keep.slice(0, 12).map((article) => ({
          title: article.title,
          slug: article.slug,
          category: article.category,
          score: scoreArticleForAdsenseRetention(article)
        })),
        draftedSample: plan.allToDraft.slice(0, 12).map((article) => ({
          title: article.title,
          slug: article.slug,
          category: article.category,
          score: scoreArticleForAdsenseRetention(article)
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
