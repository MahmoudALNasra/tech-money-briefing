import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

const PAGE_SIZE = 200;

async function run() {
  const supabase = getSupabaseClient();
  let offset = 0;
  let updated = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from("article_media")
      .select("id,caption,alt_text")
      .eq("provider", "image")
      .not("provider_id", "like", "hero:%")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    if (!rows?.length) {
      break;
    }

    for (const row of rows) {
      const needsCaptionClear =
        Boolean(row.caption) &&
        /image source:|— image source/i.test(String(row.caption));
      const needsAltFix = String(row.alt_text ?? "").length > 120;

      if (!needsCaptionClear && !needsAltFix) {
        continue;
      }

      const patch: Record<string, string | null> = {
        updated_at: new Date().toISOString()
      };

      if (needsCaptionClear) {
        patch.caption = null;
      }

      if (needsAltFix) {
        patch.alt_text = "Illustration related to this article";
      }

      const { error: updateError } = await supabase
        .from("article_media")
        .update(patch)
        .eq("id", row.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      updated += 1;
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  console.log(JSON.stringify({ updated }, null, 2));
}

run().catch((error) => {
  console.error("[article-image-captions] Failed", error);
  process.exitCode = 1;
});
