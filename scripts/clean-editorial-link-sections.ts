import { EDITORIAL_SOURCE_NAME } from "../lib/editorial-ingestion";
import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ArticleRow = {
  id: string;
  slug: string;
  content: string;
};

function normalizeHref(href: string) {
  try {
    return new URL(href).pathname;
  } catch {
    return href;
  }
}

function extractHrefs(markdown: string) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) =>
    normalizeHref(match[1])
  );
}

function cleanDuplicateRelatedLinks(content: string) {
  const toolsMatch = content.match(
    /## Tools mentioned in this guide\n\n((?:- \[[^\]]+\]\([^)]+\)\n?)+)/
  );
  const relatedMatch = content.match(
    /## Related on Tech Revenue Brief\n\n((?:- \[[^\]]+\]\([^)]+\)\n?)+)/
  );

  if (!toolsMatch || !relatedMatch) {
    return content;
  }

  const toolHrefs = new Set(extractHrefs(toolsMatch[1]));
  const relatedLines = relatedMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const remainingRelatedLines = relatedLines.filter((line) => {
    const href = extractHrefs(line)[0];
    return href && !toolHrefs.has(href);
  });

  if (remainingRelatedLines.length === relatedLines.length) {
    return content;
  }

  if (remainingRelatedLines.length === 0) {
    return content
      .replace(relatedMatch[0], "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return content.replace(
    relatedMatch[0],
    `## Related on Tech Revenue Brief\n\n${remainingRelatedLines.join("\n")}`
  );
}

async function run() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,content")
    .eq("source_name", EDITORIAL_SOURCE_NAME)
    .eq("status", "published")
    .limit(200);

  if (error) {
    throw new Error(`Failed to load editorial articles: ${error.message}`);
  }

  const result = {
    checked: data?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of (data ?? []) as ArticleRow[]) {
    try {
      const cleanedContent = cleanDuplicateRelatedLinks(article.content);

      if (cleanedContent === article.content) {
        result.skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({ content: cleanedContent })
        .eq("id", article.id);

      if (updateError) {
        throw updateError;
      }

      result.updated += 1;
      console.log(`[editorial-links] cleaned duplicate links for ${article.slug}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[editorial-links] Cleanup failed", error);
  process.exitCode = 1;
});
