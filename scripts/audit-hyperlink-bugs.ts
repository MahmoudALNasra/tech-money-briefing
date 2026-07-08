/**
 * Audit published articles for hyperlink rendering bugs.
 * Usage: npm run articles:audit-hyperlinks [--dry-run]
 */

import { loadLocalEnv } from "../lib/load-env";
import {
  detectOwnerVoiceLinkFiller,
  polishOwnerVoiceLinks
} from "../lib/owner-voice/aeo-content";
import { normalizeArticleContent, stripMarkdownFromHeadingLabel } from "../lib/article-markdown";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

const DUPLICATE_URL_RE =
  /\[[^\]]+]\((https?:\/\/[^)\s]+)\)\s*(?:<[^>]+>|\([^)]*\)|(https?:\/\/[^\s)]+))/gi;

const HEADING_LINK_RE = /^#{2,4}\s+.*\[[^\]]+]\([^)]+\)/m;

async function loadPublishedArticles() {
  const pageSize = 100;
  const rows: Array<{
    id: string;
    slug: string;
    category: string;
    content: string;
    title: string;
  }> = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("articles")
      .select("id,slug,category,content,title")
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

function auditContent(content: string) {
  const issues: string[] = [];

  if (detectOwnerVoiceLinkFiller(content).length > 0) {
    issues.push("link_filler");
  }

  if (DUPLICATE_URL_RE.test(content)) {
    issues.push("duplicate_url_after_link");
  }
  DUPLICATE_URL_RE.lastIndex = 0;

  const headingLines = content
    .split(/\r?\n/)
    .filter((line) => HEADING_LINK_RE.test(line.trim()));

  if (headingLines.length > 0) {
    issues.push(`heading_markdown_links:${headingLines.length}`);
  }

  return { issues, headingLines };
}

function fixContent(content: string, category: string) {
  return normalizeArticleContent(polishOwnerVoiceLinks(content, { category }));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const articles = await loadPublishedArticles();
  const flagged: Array<{
    slug: string;
    title: string;
    issues: string[];
    headingSamples: string[];
  }> = [];
  const updates: string[] = [];

  for (const article of articles) {
    const { issues, headingLines } = auditContent(article.content);

    if (issues.length > 0) {
      flagged.push({
        slug: article.slug,
        title: article.title,
        issues,
        headingSamples: headingLines.slice(0, 2).map((line) => line.trim())
      });
    }

    const nextContent = fixContent(article.content, article.category);

    if (nextContent !== article.content) {
      updates.push(article.slug);

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
  }

  if (!dryRun && updates.length > 0) {
    try {
      await revalidateSiteCache({
        paths: ["/"],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[audit-hyperlink-bugs] Revalidate failed", error);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        checked: articles.length,
        flagged: flagged.length,
        wouldUpdate: updates.length,
        flaggedArticles: flagged,
        updateSlugs: updates
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[audit-hyperlink-bugs] Failed", error);
  process.exitCode = 1;
});
