import { appendFileSync, mkdirSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const LOG = "data/owner-voice-runs/completed.jsonl";

export async function applyManualArticles(articles) {
  mkdirSync("data/owner-voice-runs", { recursive: true });

  for (const article of articles) {
    const { error } = await supabase
      .from("articles")
      .update({
        title: article.title,
        meta_description: article.meta_description,
        key_takeaways: article.key_takeaways,
        content: article.content,
        source_name: "Tech Revenue Brief Editors",
        updated_at: new Date().toISOString()
      })
      .eq("slug", article.slug);

    if (error) {
      throw new Error(`${article.slug}: ${error.message}`);
    }

    appendFileSync(LOG, `${JSON.stringify({ slug: article.slug })}\n`);
    console.log("updated", article.slug);
  }

  console.log("done", articles.length);
}
