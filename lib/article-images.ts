import { getArticleMedia } from "./article-media";
import { supabase } from "./supabase";
import type { ArticleMedia } from "./types";
import { highQualityYouTubeThumbnail } from "./youtube-thumbnails";

const IMAGE_CHECK_TIMEOUT_MS = 5000;
const usableCache = new Map<string, boolean>();

export async function isImageUrlUsable(url: string | null | undefined) {
  if (!url?.trim()) {
    return false;
  }

  const normalized = url.trim();

  if (usableCache.has(normalized)) {
    return usableCache.get(normalized) === true;
  }

  try {
    const response = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS)
    });

    const contentType = response.headers.get("content-type") ?? "";
    const usable =
      response.ok &&
      (contentType.startsWith("image/") || normalized.includes("ytimg.com"));

    usableCache.set(normalized, usable);
    return usable;
  } catch {
    usableCache.set(normalized, false);
    return false;
  }
}

export function heroImageFromMedia(media: ArticleMedia[]) {
  const firstVideo = media.find((item) => item.provider === "youtube");

  if (!firstVideo?.provider_id) {
    return firstVideo?.thumbnail_url ?? null;
  }

  return highQualityYouTubeThumbnail(firstVideo.provider_id);
}

export async function resolveArticleHeroImage(input: {
  image_url: string | null;
  media?: ArticleMedia[];
}) {
  if (await isImageUrlUsable(input.image_url)) {
    return input.image_url!.trim();
  }

  const mediaFallback = heroImageFromMedia(input.media ?? []);

  if (await isImageUrlUsable(mediaFallback)) {
    return mediaFallback;
  }

  return null;
}

export async function syncArticleHeroImage(input: {
  articleId: string;
  currentImageUrl?: string | null;
}) {
  const media = await getArticleMedia(input.articleId);
  const resolved = await resolveArticleHeroImage({
    image_url: input.currentImageUrl ?? null,
    media
  });

  if (!resolved || resolved === input.currentImageUrl) {
    return { updated: false, image_url: input.currentImageUrl ?? null };
  }

  const { error } = await supabase
    .from("articles")
    .update({ image_url: resolved, updated_at: new Date().toISOString() })
    .eq("id", input.articleId);

  if (error) {
    throw new Error(`Failed to sync article hero image: ${error.message}`);
  }

  return { updated: true, image_url: resolved };
}
