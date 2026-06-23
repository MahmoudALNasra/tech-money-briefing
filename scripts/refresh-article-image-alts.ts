import { buildArticleImageAlts } from "../lib/article-image-alt";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

const PAGE_SIZE = 40;

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length).trim() || undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function needsAltRefresh(current: string | null | undefined) {
  const alt = current?.trim() ?? "";

  if (!alt) {
    return true;
  }

  if (/^illustration related to this article$/i.test(alt)) {
    return true;
  }

  if (alt.length < 48) {
    return true;
  }

  return false;
}

async function run() {
  const supabase = getSupabaseClient();
  const slug = getStringArg("slug");
  const fetchAll = hasFlag("all");
  const delayMs = Number(getStringArg("delay-ms") ?? (fetchAll ? "300" : "0"));

  let articleQuery = supabase
    .from("articles")
    .select("id,slug,title,category,meta_description")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (slug) {
    articleQuery = articleQuery.eq("slug", slug);
  } else if (!fetchAll) {
    articleQuery = articleQuery.limit(25);
  }

  const { data: articles, error } = await articleQuery;

  if (error) {
    throw new Error(error.message);
  }

  const result = {
    checked: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of articles ?? []) {
    result.checked += 1;

    try {
      const { data: media, error: mediaError } = await supabase
        .from("article_media")
        .select("id,title,source_name,alt_text,provider_id")
        .eq("article_id", article.id)
        .eq("provider", "image")
        .not("provider_id", "like", "hero:%")
        .order("position", { ascending: true });

      if (mediaError) {
        throw new Error(mediaError.message);
      }

      if (!media?.length) {
        result.skipped += 1;
        continue;
      }

      const alts = await buildArticleImageAlts({
        articleTitle: article.title,
        category: article.category,
        metaDescription: article.meta_description,
        images: media.map((row) => ({
          referenceTitle: String(row.title ?? article.title),
          sourceName: row.source_name ? String(row.source_name) : null
        }))
      });

      for (const [index, row] of media.entries()) {
        const alt = alts[index];
        if (!alt) {
          continue;
        }

        if (!needsAltRefresh(row.alt_text) && alt === row.alt_text) {
          continue;
        }

        const { error: updateError } = await supabase
          .from("article_media")
          .update({
            alt_text: alt,
            caption: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", row.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      result.updated += 1;
      console.log(`[article:image-alts] ${article.slug}: refreshed ${media.length} alt(s)`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (!slug && result.updated > 0) {
    try {
      await revalidateSiteCache({ tags: ["articles"] });
    } catch (error) {
      console.warn("[article:image-alts] Revalidate failed", error);
    }
  }

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[article:image-alts] Failed", error);
  process.exitCode = 1;
});
