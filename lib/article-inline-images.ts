import { isSiteHostedArticleImage, localizeRemoteArticleImageUrls } from "@/lib/article-local-images";
import { getArticleMedia } from "@/lib/article-media";
import { enrichArticleWebImages } from "@/lib/article-web-images";
import { supabase } from "@/lib/supabase";

function isRemoteImageUrl(url: string | null | undefined) {
  return Boolean(url?.trim().startsWith("http"));
}

function isHeroMediaRow(providerId: string) {
  return providerId.startsWith("hero:");
}

export async function localizeArticleImageMediaRows(input: {
  articleId: string;
  slug: string;
  title: string;
  publishedAt?: string | null;
}) {
  const { data: rows, error } = await supabase
    .from("article_media")
    .select("id,provider,provider_id,title,url,thumbnail_url")
    .eq("article_id", input.articleId)
    .eq("provider", "image");

  if (error) {
    throw new Error(`Failed to load article image media: ${error.message}`);
  }

  let localized = 0;
  let skipped = 0;

  for (const [index, row] of (rows ?? []).entries()) {
    const providerId = String(row.provider_id ?? "");

    if (isHeroMediaRow(providerId)) {
      skipped += 1;
      continue;
    }

    const currentUrl = row.url ? String(row.url) : "";
    const currentThumb = row.thumbnail_url ? String(row.thumbnail_url) : null;

    if (
      (currentUrl && isSiteHostedArticleImage(currentUrl)) &&
      (!currentThumb || isSiteHostedArticleImage(currentThumb))
    ) {
      skipped += 1;
      continue;
    }

    if (!isRemoteImageUrl(currentUrl) && !isRemoteImageUrl(currentThumb)) {
      skipped += 1;
      continue;
    }

    if (!currentUrl) {
      skipped += 1;
      continue;
    }

    const localizedUrls = isRemoteImageUrl(currentUrl)
      ? await localizeRemoteArticleImageUrls({
          imageUrl: currentUrl,
          thumbnailUrl: currentThumb,
          slug: `${input.slug}-inline-${index + 1}`,
          title: String(row.title ?? input.title),
          publishedAt: input.publishedAt
        })
      : null;

    if (!localizedUrls) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("article_media")
      .update({
        url: localizedUrls.imageUrl,
        thumbnail_url: localizedUrls.thumbnailUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(`Failed to localize article media: ${updateError.message}`);
    }

    localized += 1;
  }

  return { localized, skipped };
}

export async function syncArticleInlineImages(input: {
  articleId: string;
  slug: string;
  title: string;
  category: string;
  metaDescription?: string;
  publishedAt?: string | null;
  limit?: number;
}) {
  const media = await getArticleMedia(input.articleId);
  const inlineImages = media.filter(
    (item) => item.provider === "image" && !isHeroMediaRow(item.provider_id)
  );

  if (inlineImages.length === 0) {
    const enriched = await enrichArticleWebImages({
      articleId: input.articleId,
      slug: input.slug,
      title: input.title,
      category: input.category,
      metaDescription: input.metaDescription,
      publishedAt: input.publishedAt,
      limit: input.limit
    });

    return {
      action: "enriched" as const,
      inserted: enriched.inserted,
      localized: enriched.inserted,
      skipped: enriched.skipped
    };
  }

  const hasRemoteInline = inlineImages.some(
    (item) => isRemoteImageUrl(item.url) || isRemoteImageUrl(item.thumbnail_url)
  );

  if (!hasRemoteInline) {
    return {
      action: "already_local" as const,
      inserted: 0,
      localized: 0,
      skipped: inlineImages.length
    };
  }

  const result = await localizeArticleImageMediaRows({
    articleId: input.articleId,
    slug: input.slug,
    title: input.title,
    publishedAt: input.publishedAt
  });

  return {
    action: "localized" as const,
    inserted: 0,
    localized: result.localized,
    skipped: result.skipped
  };
}
