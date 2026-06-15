import { existsSync } from "fs";
import { resolve } from "path";

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

  if (isMediaArticlesPath(normalized)) {
    return true;
  }

  if (isGeneratedArticlePath(normalized)) {
    return isLocalPublicAssetAvailable(normalized);
  }

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
  const firstImage = media.find((item) => item.provider === "image");

  if (firstImage?.url) {
    return firstImage.url;
  }

  if (firstImage?.thumbnail_url) {
    return firstImage.thumbnail_url;
  }

  const firstVideo = media.find((item) => item.provider === "youtube");

  if (!firstVideo?.provider_id) {
    return firstVideo?.thumbnail_url ?? null;
  }

  return highQualityYouTubeThumbnail(firstVideo.provider_id);
}

export function isGeneratedHeroImage(url: string | null | undefined) {
  return Boolean(url && url.includes("/generated/article-"));
}

function isMediaArticlesPath(url: string) {
  return url.startsWith("/media/articles/") || url.includes("/media/articles/");
}

function isGeneratedArticlePath(url: string) {
  return url.includes("/generated/article-");
}

function isSiteHostedArticleImage(url: string | null | undefined) {
  return Boolean(
    url && (isMediaArticlesPath(url) || isGeneratedArticlePath(url))
  );
}

function isLocalPublicAssetAvailable(url: string) {
  if (!url.startsWith("/")) {
    return false;
  }

  const filePath = resolve(process.cwd(), "public", url.replace(/^\//, ""));
  return existsSync(filePath);
}

export async function resolveArticleHeroImage(input: {
  image_url: string | null;
  media?: ArticleMedia[];
  preferMedia?: boolean;
}) {
  const mediaFallback = heroImageFromMedia(input.media ?? []);

  if (input.preferMedia && (await isImageUrlUsable(mediaFallback))) {
    return mediaFallback;
  }

  if (await isImageUrlUsable(input.image_url)) {
    return input.image_url!.trim();
  }

  if (await isImageUrlUsable(mediaFallback)) {
    return mediaFallback;
  }

  return null;
}

export async function syncArticleHeroImage(input: {
  articleId: string;
  currentImageUrl?: string | null;
  preferMedia?: boolean;
}) {
  const media = await getArticleMedia(input.articleId);
  const resolved = await resolveArticleHeroImage({
    image_url: input.currentImageUrl ?? null,
    media,
    preferMedia: input.preferMedia
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
