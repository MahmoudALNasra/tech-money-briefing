import { supabase } from "./supabase";
import type { ArticleMedia } from "./types";
import {
  isYouTubeQuotaError,
  searchYouTubeVideos,
  type YouTubeVideo
} from "./youtube";
import { isImageUrlUsable } from "./article-images";

function mapArticleMedia(row: Record<string, unknown>): ArticleMedia {
  return {
    id: String(row.id),
    article_id: String(row.article_id),
    provider: row.provider === "image" ? "image" : "youtube",
    provider_id: String(row.provider_id),
    title: String(row.title),
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    url: String(row.url),
    position: Number(row.position ?? 0),
    alt_text: row.alt_text ? String(row.alt_text) : null,
    caption: row.caption ? String(row.caption) : null,
    source_name: row.source_name ? String(row.source_name) : null,
    source_url: row.source_url ? String(row.source_url) : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined
  };
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.message?.toLowerCase().includes("article_media") ||
    error.message?.toLowerCase().includes("does not exist")
  );
}

export async function getArticleMedia(articleId: string) {
  const { data, error } = await supabase
    .from("article_media")
    .select("*")
    .eq("article_id", articleId)
    .order("position", { ascending: true })
    .limit(6);

  if (error) {
    if (isMissingTableError(error)) {
      console.warn("[article-media] Skipped: article_media table is missing");
      return [];
    }

    throw new Error(`Failed to load article media: ${error.message}`);
  }

  return (data ?? []).map((row) => mapArticleMedia(row as Record<string, unknown>));
}

export async function replaceArticleMedia(
  articleId: string,
  videos: YouTubeVideo[]
) {
  const { error: deleteError } = await supabase
    .from("article_media")
    .delete()
    .eq("article_id", articleId)
    .eq("provider", "youtube");

  if (deleteError) {
    if (isMissingTableError(deleteError)) {
      console.warn("[article-media] Skipped: article_media table is missing");
      return { inserted: 0, skipped: videos.length };
    }

    throw new Error(`Failed to clear article media: ${deleteError.message}`);
  }

  if (videos.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const rows = videos.slice(0, 3).map((video, index) => ({
    article_id: articleId,
    provider: video.provider,
    provider_id: video.provider_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    url: video.url,
    position: index
  }));
  const { error: insertError } = await supabase.from("article_media").insert(rows);

  if (insertError) {
    if (isMissingTableError(insertError)) {
      console.warn("[article-media] Skipped: article_media table is missing");
      return { inserted: 0, skipped: videos.length };
    }

    throw new Error(`Failed to insert article media: ${insertError.message}`);
  }

  return { inserted: rows.length, skipped: 0 };
}

export type ArticleHeroImageCandidate = {
  providerId: string;
  title: string;
  imageUrl: string;
  altText: string;
  caption: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
};

export async function ensureArticleHeroImageMedia(input: {
  articleId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}) {
  if (!(await isImageUrlUsable(input.imageUrl))) {
    return { inserted: 0, skipped: 1 };
  }

  const providerId = `hero:${input.slug}`;
  const { data: existing, error: existingError } = await supabase
    .from("article_media")
    .select("id")
    .eq("article_id", input.articleId)
    .eq("provider", "image")
    .eq("provider_id", providerId)
    .limit(1);

  if (existingError) {
    if (isMissingTableError(existingError)) {
      console.warn("[article-media] Skipped: article_media table is missing");
      return { inserted: 0, skipped: 1 };
    }

    throw new Error(`Failed to check article hero media: ${existingError.message}`);
  }

  if ((existing ?? []).length > 0) {
    return { inserted: 0, skipped: 1 };
  }

  const imageRow = {
    article_id: input.articleId,
    provider: "image",
    provider_id: providerId,
    title: input.title,
    thumbnail_url: input.imageUrl,
    url: input.imageUrl,
    position: 3,
    alt_text: `${input.title} hero image`,
    caption: "Article cover image",
    source_name: input.sourceName ?? null,
    source_url: input.sourceUrl ?? null
  };

  const { error: insertError } = await supabase.from("article_media").insert([imageRow]);

  if (insertError) {
    if (isMissingTableError(insertError)) {
      console.warn("[article-media] Skipped: article_media image columns are missing");
      return { inserted: 0, skipped: 1 };
    }

    throw new Error(`Failed to insert article hero image media: ${insertError.message}`);
  }

  return { inserted: 1, skipped: 0 };
}

export type ArticleImageCandidate = {
  providerId: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  altText: string;
  caption?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
};

export async function replaceArticleImageMedia(
  articleId: string,
  images: ArticleImageCandidate[]
) {
  const { error: deleteError } = await supabase
    .from("article_media")
    .delete()
    .eq("article_id", articleId)
    .eq("provider", "image")
    .not("provider_id", "like", "hero:%");

  if (deleteError) {
    if (isMissingTableError(deleteError)) {
      console.warn("[article-media] Skipped: article_media table is missing");
      return { inserted: 0, skipped: images.length };
    }

    throw new Error(`Failed to clear article image media: ${deleteError.message}`);
  }

  if (images.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const rows = images.slice(0, 3).map((image, index) => ({
    article_id: articleId,
    provider: "image",
    provider_id: image.providerId,
    title: image.title,
    thumbnail_url: image.thumbnailUrl ?? image.imageUrl,
    url: image.imageUrl,
    alt_text: image.altText,
    caption: image.caption,
    source_name: image.sourceName ?? null,
    source_url: image.sourceUrl ?? null,
    position: index + 3
  }));

  const { error: insertError } = await supabase.from("article_media").insert(rows);

  if (insertError) {
    if (isMissingTableError(insertError)) {
      console.warn("[article-media] Skipped: article_media image columns are missing");
      return { inserted: 0, skipped: images.length };
    }

    throw new Error(`Failed to insert article image media: ${insertError.message}`);
  }

  return { inserted: rows.length, skipped: 0 };
}

export async function enrichArticleMedia(input: {
  articleId: string;
  title: string;
  category?: string;
  metaDescription?: string;
  throwOnQuota?: boolean;
}) {
  try {
    const videos = await searchYouTubeVideos({
      title: input.title,
      category: input.category,
      metaDescription: input.metaDescription,
      maxResults: 3
    });

    if (videos.length === 0) {
      return { inserted: 0, skipped: 0 };
    }

    return await replaceArticleMedia(input.articleId, videos);
  } catch (error) {
    if (input.throwOnQuota && isYouTubeQuotaError(error)) {
      throw error;
    }

    console.warn(
      "[article-media] Video enrichment skipped",
      error instanceof Error ? error.message : error
    );

    return { inserted: 0, skipped: 0 };
  }
}
