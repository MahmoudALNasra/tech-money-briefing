import { loadLocalEnv } from "../lib/load-env";
import { fetchAllGscQueryPageRows } from "../lib/google-search-console";
import {
  attachSuggestedTopics,
  fetchGscOpportunities,
  loadPublishedArticleRefs
} from "../lib/gsc-seo";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function run() {
  const limit = getNumberArg("limit", 30);
  const days = getNumberArg("days", Number(process.env.GSC_LOOKBACK_DAYS ?? 28));
  const withTopics = process.argv.includes("--with-topics");
  const includeStats = process.argv.includes("--stats");
  const typeFilter = process.argv.includes("--create-only")
    ? "create_article"
    : process.argv.includes("--improve-only")
      ? "improve_existing"
      : undefined;

  console.log(`[gsc-opportunities] Fetching last ${days} days...`);

  let opportunities = await fetchGscOpportunities({ days });
  let stats: Record<string, unknown> | undefined;

  if (includeStats) {
    const [rows, articles] = await Promise.all([
      fetchAllGscQueryPageRows({ days }),
      loadPublishedArticleRefs()
    ]);
    stats = {
      rawRows: rows.length,
      rowsWithQuery: rows.filter((row) => row.query).length,
      publishedArticles: articles.length,
      minImpressions: process.env.GSC_MIN_IMPRESSIONS ?? 3
    };
  }

  if (typeFilter) {
    opportunities = opportunities.filter((op) => op.type === typeFilter);
  }

  opportunities = opportunities.slice(0, limit);

  if (withTopics) {
    const createCount = opportunities.filter((op) => op.type === "create_article").length;
    if (createCount > 0) {
      console.log(`[gsc-opportunities] Generating ${createCount} editorial topic suggestions...`);
      opportunities = await attachSuggestedTopics(opportunities);
    }
  }

  const summary = {
    days,
    limit,
    ...(stats ? { stats } : {}),
    total: opportunities.length,
    improve: opportunities.filter((op) => op.type === "improve_existing").length,
    create: opportunities.filter((op) => op.type === "create_article").length,
    opportunities: opportunities.map((op) => ({
      type: op.type,
      score: op.score,
      query: op.query,
      page: op.page,
      impressions: op.impressions,
      position: op.position,
      ctr: Number((op.ctr * 100).toFixed(2)),
      reason: op.reason,
      article: op.article
        ? `/${op.article.category}/${op.article.slug}`
        : undefined,
      suggestedTopic: op.suggestedTopic
        ? {
            id: op.suggestedTopic.id,
            title: op.suggestedTopic.title,
            category: op.suggestedTopic.category
          }
        : undefined
    }))
  };

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error("[gsc-opportunities] Failed", error);
  process.exitCode = 1;
});
