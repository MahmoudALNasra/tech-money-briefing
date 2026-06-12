import { loadLocalEnv } from "../lib/load-env";
import {
  isGeneratedHeroImage,
  isImageUrlUsable,
  resolveArticleHeroImage
} from "../lib/article-images";
import { importArticleImageToPublic } from "../lib/article-public-image-files";
import type { ArticleMedia } from "../lib/types";
import { getSupabaseClient } from "../lib/supabase";
import { revalidateSiteCache } from "../lib/revalidate-site";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length).trim() || undefined;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const localizeAll = process.argv.includes("--localize-all");
  const limit = getNumberArg("limit", 250);
  const slug = getStringArg("slug");
  const category = getStringArg("category");
  const since = getStringArg("since");
  const supabase = getSupabaseClient();

  let query = supabase
    .from("articles")
    .select("id,slug,title,category,image_url,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (slug) {
    query = query.eq("slug", slug);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (since) {
    query = query.gte("published_at", since);
  }

  const { data: articles, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  const result = {
    dryRun,
    checked: articles?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    samples: [] as Array<{ slug: string; from: string | null; to: string }>
  };

  const pathsToRevalidate: string[] = [];

  for (const article of articles ?? []) {
    try {
      const currentUrl = article.image_url ? String(article.image_url) : null;
      const currentUsable = await isImageUrlUsable(currentUrl);
      const shouldPreferMedia = article.category === "others";
      const shouldReplaceGeneratedHero =
        article.category === "others" && isGeneratedHeroImage(currentUrl);
      const shouldLocalizeCurrent = localizeAll && Boolean(currentUrl?.startsWith("http"));

      if (
        currentUsable &&
        !shouldPreferMedia &&
        !shouldReplaceGeneratedHero &&
        !shouldLocalizeCurrent
      ) {
        result.skipped += 1;
        continue;
      }

      const { data: media, error: mediaError } = await supabase
        .from("article_media")
        .select(
          "id,provider,provider_id,title,thumbnail_url,url,position,alt_text,caption,source_name,source_url"
        )
        .eq("article_id", article.id)
        .order("position", { ascending: true });

      if (mediaError) {
        throw new Error(mediaError.message);
      }

      const localizedMedia: ArticleMedia[] = [];

      for (const row of media ?? []) {
        const provider = row.provider === "image" ? "image" : "youtube";
        let mediaUrl = row.url ? String(row.url) : "";
        let thumbnailUrl = row.thumbnail_url ? String(row.thumbnail_url) : null;

        if (provider === "image" && mediaUrl) {
          const localizedUrl = await importArticleImageToPublic({
            imageUrl: mediaUrl,
            slug: String(article.slug),
            title: String(row.title ?? article.title),
            publishedAt: article.published_at ? String(article.published_at) : null
          });
          const localizedThumbnail = thumbnailUrl
            ? await importArticleImageToPublic({
                imageUrl: thumbnailUrl,
                slug: `${String(article.slug)}-thumb`,
                title: String(row.title ?? article.title),
                publishedAt: article.published_at ? String(article.published_at) : null
              })
            : localizedUrl;

          if (localizedUrl && localizedUrl !== mediaUrl && !dryRun) {
            const { error: mediaUpdateError } = await supabase
              .from("article_media")
              .update({
                url: localizedUrl,
                thumbnail_url: localizedThumbnail ?? localizedUrl,
                updated_at: new Date().toISOString()
              })
              .eq("id", row.id);

            if (mediaUpdateError) {
              throw mediaUpdateError;
            }
          }

          mediaUrl = localizedUrl ?? mediaUrl;
          thumbnailUrl = localizedThumbnail ?? thumbnailUrl;
        }

        localizedMedia.push({
          id: String(row.id ?? row.provider_id),
          article_id: String(article.id),
          provider,
          provider_id: String(row.provider_id),
          title: row.title ? String(row.title) : "",
          thumbnail_url: thumbnailUrl,
          url: mediaUrl,
          position: Number(row.position ?? 0),
          alt_text: row.alt_text ? String(row.alt_text) : null,
          caption: row.caption ? String(row.caption) : null,
          source_name: row.source_name ? String(row.source_name) : null,
          source_url: row.source_url ? String(row.source_url) : null
        });
      }

      const resolvedRemote = await resolveArticleHeroImage({
        image_url: shouldReplaceGeneratedHero ? null : currentUrl,
        media: localizedMedia,
        preferMedia: shouldPreferMedia
      });
      const resolved = await importArticleImageToPublic({
        imageUrl: resolvedRemote,
        slug: String(article.slug),
        title: String(article.title),
        publishedAt: article.published_at ? String(article.published_at) : null
      });

      if (!resolved || !(await isImageUrlUsable(resolved))) {
        result.skipped += 1;
        continue;
      }

      if (dryRun) {
        result.updated += 1;
        result.samples.push({
          slug: article.slug,
          from: currentUrl,
          to: resolved
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({ image_url: resolved, updated_at: new Date().toISOString() })
        .eq("id", article.id);

      if (updateError) {
        throw updateError;
      }

      result.updated += 1;
      pathsToRevalidate.push(`/${article.category}/${article.slug}`);
      console.log(`[fix-images] ${article.slug} -> ${resolved}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!dryRun && pathsToRevalidate.length > 0) {
    try {
      await revalidateSiteCache({
        paths: [...new Set(pathsToRevalidate)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[fix-images] Revalidate failed", error);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[fix-images] Failed", error);
  process.exitCode = 1;
});
