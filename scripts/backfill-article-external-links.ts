/**
 * Backfill natural inline external links only (no boilerplate sentences).
 */

import { loadLocalEnv } from "../lib/load-env";
import { normalizeArticleContent } from "../lib/article-markdown";
import {
  countExternalMarkdownLinks,
  polishOwnerVoiceLinks
} from "../lib/owner-voice/aeo-content";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function loadPublishedArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,category,content")
    .eq("status", "published")
    .neq("category", "others")
    .not("source_name", "ilike", "%Referral%");

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  return data ?? [];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let updated = 0;

  for (const article of await loadPublishedArticles()) {
    const nextContent = normalizeArticleContent(
      polishOwnerVoiceLinks(article.content, { category: article.category })
    );

    if (nextContent === article.content) {
      continue;
    }

    updated += 1;

    if (!dryRun) {
      const { error } = await supabase
        .from("articles")
        .update({
          content: nextContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", article.id);

      if (error) {
        throw new Error(`Failed to update ${article.slug}: ${error.message}`);
      }
    }
  }

  if (!dryRun && updated > 0) {
    await revalidateSiteCache({ paths: ["/"], tags: ["articles"] }).catch(
      () => undefined
    );
  }

  console.log(JSON.stringify({ ok: true, dryRun, updated }, null, 2));
}

main().catch((error) => {
  console.error("[backfill-external-links] Failed", error);
  process.exitCode = 1;
});
