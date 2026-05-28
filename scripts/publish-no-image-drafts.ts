import { loadLocalEnv } from "../lib/load-env";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function publishNoImageDrafts() {
  const { count: nullImageCount, error: nullCountError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft")
    .is("image_url", null);

  if (nullCountError) {
    throw new Error(`Failed to count null image drafts: ${nullCountError.message}`);
  }

  const { count: emptyImageCount, error: emptyCountError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft")
    .eq("image_url", "");

  if (emptyCountError) {
    throw new Error(`Failed to count empty image drafts: ${emptyCountError.message}`);
  }

  const publishedAt = new Date().toISOString();

  const { error: nullUpdateError } = await supabase
    .from("articles")
    .update({ status: "published", published_at: publishedAt })
    .eq("status", "draft")
    .is("image_url", null);

  if (nullUpdateError) {
    throw new Error(`Failed to publish null image drafts: ${nullUpdateError.message}`);
  }

  const { error: emptyUpdateError } = await supabase
    .from("articles")
    .update({ status: "published", published_at: publishedAt })
    .eq("status", "draft")
    .eq("image_url", "");

  if (emptyUpdateError) {
    throw new Error(`Failed to publish empty image drafts: ${emptyUpdateError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        published: (nullImageCount ?? 0) + (emptyImageCount ?? 0),
        nullImageCount: nullImageCount ?? 0,
        emptyImageCount: emptyImageCount ?? 0
      },
      null,
      2
    )
  );
}

publishNoImageDrafts().catch((error) => {
  console.error("[articles:publish-no-image-drafts] Failed", error);
  process.exitCode = 1;
});
