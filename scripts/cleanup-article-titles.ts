import { loadLocalEnv } from "../lib/load-env";
import {
  cleanOwnerVoiceArticleTitle,
  detectTemplatedOwnerVoiceTitle
} from "../lib/owner-voice/title-cleanup";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ArticleTitleRow = {
  id: string;
  slug: string;
  title: string;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,title")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const rows = (data ?? []) as ArticleTitleRow[];
  const updates: Array<{ id: string; slug: string; from: string; to: string }> = [];

  for (const row of rows) {
    const issues = detectTemplatedOwnerVoiceTitle(row.title);
    const { cleaned, changed } = cleanOwnerVoiceArticleTitle(row.title);

    if (!changed && issues.length === 0) {
      continue;
    }

    if (!changed) {
      console.warn(`[skip-no-clean] ${row.slug}: ${issues.join("; ")}`);
      continue;
    }

    updates.push({
      id: row.id,
      slug: row.slug,
      from: row.title,
      to: cleaned
    });
  }

  console.log(`Scanned ${rows.length} published articles.`);
  console.log(`Titles to update: ${updates.length}`);

  for (const update of updates.slice(0, 20)) {
    console.log(`- ${update.slug}`);
    console.log(`  from: ${update.from}`);
    console.log(`  to:   ${update.to}`);
  }

  if (updates.length > 20) {
    console.log(`... and ${updates.length - 20} more`);
  }

  if (dryRun) {
    console.log("Dry run — no database changes made.");
    return;
  }

  let updated = 0;

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("articles")
      .update({
        title: update.to,
        updated_at: new Date().toISOString()
      })
      .eq("id", update.id);

    if (updateError) {
      console.error(`Failed ${update.slug}: ${updateError.message}`);
      continue;
    }

    updated += 1;
  }

  if (updated > 0) {
    await revalidateSiteCache();
  }

  console.log(`Updated ${updated} article titles.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
