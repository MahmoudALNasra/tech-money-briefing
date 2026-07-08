/**
 * Republish draft articles that still earn GSC impressions (recovery after corpus trim).
 * Usage: npm run articles:republish-gsc [--dry-run] [--limit=150]
 */

import { parseArticlePathFromGscPage } from "../lib/gsc-seo";
import { fetchAllGscQueryPageRows } from "../lib/google-search-console";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) {
    return fallback;
  }

  const value = Number(match.slice(prefix.length));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = getNumberArg("limit", 150);
  const days = getNumberArg("days", 90);

  const rows = await fetchAllGscQueryPageRows({ days });
  const impressionsByPage = new Map<string, number>();

  for (const row of rows) {
    if (!row.page) {
      continue;
    }

    impressionsByPage.set(
      row.page,
      (impressionsByPage.get(row.page) ?? 0) + row.impressions
    );
  }

  const articlePages = [...impressionsByPage.entries()]
    .map(([page, impressions]) => ({
      page,
      impressions,
      parsed: parseArticlePathFromGscPage(page)
    }))
    .filter((entry) => entry.parsed)
    .sort((left, right) => right.impressions - left.impressions);

  const toRepublish: Array<{
    id: string;
    slug: string;
    category: string;
    impressions: number;
  }> = [];

  for (const entry of articlePages) {
    if (toRepublish.length >= limit) {
      break;
    }

    const { category, slug } = entry.parsed!;

    const { data, error } = await supabase
      .from("articles")
      .select("id,slug,category,status")
      .eq("category", category)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Lookup failed for ${category}/${slug}: ${error.message}`);
    }

    if (!data || data.status === "published") {
      continue;
    }

    toRepublish.push({
      id: data.id,
      slug: data.slug,
      category: data.category,
      impressions: entry.impressions
    });
  }

  if (!dryRun && toRepublish.length > 0) {
    const ids = toRepublish.map((article) => article.id);
    const { error } = await supabase
      .from("articles")
      .update({
        status: "published",
        updated_at: new Date().toISOString()
      })
      .in("id", ids);

    if (error) {
      throw new Error(`Republish failed: ${error.message}`);
    }

    await revalidateSiteCache({
      paths: ["/"],
      tags: ["articles"]
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        days,
        gscPagesWithImpressions: impressionsByPage.size,
        republished: dryRun ? 0 : toRepublish.length,
        candidates: toRepublish.slice(0, 25)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[republish-gsc] Failed", error);
  process.exitCode = 1;
});
