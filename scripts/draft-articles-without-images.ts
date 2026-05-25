import { loadLocalEnv } from "../lib/load-env";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function draftArticlesWithoutImages() {
  const { count: nullImageCount, error: nullCountError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .is("image_url", null);

  if (nullCountError) {
    throw new Error(`Failed to count null image articles: ${nullCountError.message}`);
  }

  const { count: emptyImageCount, error: emptyCountError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("image_url", "");

  if (emptyCountError) {
    throw new Error(`Failed to count empty image articles: ${emptyCountError.message}`);
  }

  const { error: nullUpdateError } = await supabase
    .from("articles")
    .update({ status: "draft" })
    .eq("status", "published")
    .is("image_url", null);

  if (nullUpdateError) {
    throw new Error(`Failed to draft null image articles: ${nullUpdateError.message}`);
  }

  const { error: emptyUpdateError } = await supabase
    .from("articles")
    .update({ status: "draft" })
    .eq("status", "published")
    .eq("image_url", "");

  if (emptyUpdateError) {
    throw new Error(`Failed to draft empty image articles: ${emptyUpdateError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        drafted: (nullImageCount ?? 0) + (emptyImageCount ?? 0),
        nullImageCount: nullImageCount ?? 0,
        emptyImageCount: emptyImageCount ?? 0
      },
      null,
      2
    )
  );
}

draftArticlesWithoutImages().catch((error) => {
  console.error("[articles:draft-no-image] Failed", error);
  process.exitCode = 1;
});
