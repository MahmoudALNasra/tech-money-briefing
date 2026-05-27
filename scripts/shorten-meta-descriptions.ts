import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
};

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function shortenMetaDescription(description: string, limit = 158) {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  const firstSentence = normalized.match(/^(.+?[.!?])\s/)?.[1]?.trim();

  if (firstSentence && firstSentence.length >= 90 && firstSentence.length <= limit) {
    return firstSentence;
  }

  const cut = normalized.slice(0, limit + 1);
  const lastSpace = cut.lastIndexOf(" ");
  const shortened = cut
    .slice(0, lastSpace > 110 ? lastSpace : limit)
    .replace(/[,:;/-]\s*$/, "")
    .trim();

  return /[.!?]$/.test(shortened) ? shortened : `${shortened}.`;
}

async function run() {
  const supabase = getSupabaseClient();
  const limit = getNumberArg("limit", 1000);
  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,title,meta_description")
    .eq("status", "published")
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const result = {
    checked: data?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of (data ?? []) as ArticleRow[]) {
    try {
      const shortened = shortenMetaDescription(article.meta_description);

      if (shortened === article.meta_description) {
        result.skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({
          meta_description: shortened,
          updated_at: new Date().toISOString()
        })
        .eq("id", article.id);

      if (updateError) {
        throw updateError;
      }

      result.updated += 1;
      console.log(
        `[meta] shortened ${article.slug} (${article.meta_description.length} -> ${shortened.length})`
      );
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
  console.error("[meta] Cleanup failed", error);
  process.exitCode = 1;
});
