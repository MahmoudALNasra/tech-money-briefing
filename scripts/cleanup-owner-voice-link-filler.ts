/**
 * Remove auto-injected link filler and fix broken markdown URLs on published articles.
 * Usage: npm run articles:cleanup-link-filler [--dry-run]
 */

import { normalizeArticleContent } from "../lib/article-markdown";
import { loadLocalEnv } from "../lib/load-env";
import {
  countExternalMarkdownLinks,
  detectOwnerVoiceLinkFiller,
  polishOwnerVoiceLinks
} from "../lib/owner-voice/aeo-content";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function loadPublishedArticles() {
  const pageSize = 100;
  const rows: Array<{
    id: string;
    slug: string;
    category: string;
    content: string;
  }> = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("articles")
      .select("id,slug,category,content")
      .eq("status", "published")
      .neq("category", "others")
      .not("source_name", "ilike", "%Referral%")
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

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const articles = await loadPublishedArticles();
  const updates: Array<{
    slug: string;
    fillerRemoved: number;
    externalAfter: number;
  }> = [];

  for (const article of articles) {
    const fillerBefore = detectOwnerVoiceLinkFiller(article.content).length;
    const nextContent = normalizeArticleContent(
      polishOwnerVoiceLinks(article.content, { category: article.category })
    );

    if (nextContent === article.content) {
      continue;
    }

    updates.push({
      slug: article.slug,
      fillerRemoved: fillerBefore,
      externalAfter: countExternalMarkdownLinks(nextContent)
    });

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

  if (!dryRun && updates.length > 0) {
    try {
      await revalidateSiteCache({
        paths: ["/"],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[cleanup-link-filler] Revalidate failed", error);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        checked: articles.length,
        updated: updates.length,
        sample: updates.slice(0, 15)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[cleanup-link-filler] Failed", error);
  process.exitCode = 1;
});
