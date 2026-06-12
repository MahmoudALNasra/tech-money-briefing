import { getArticleMedia } from "./article-media";
import { resolveArticleHeroImage } from "./article-images";
import { importArticleImageToSite } from "./article-local-images";
import { supabase } from "./supabase";

export async function syncLocalizedArticleHeroImage(input: {
  articleId: string;
  currentImageUrl?: string | null;
  preferMedia?: boolean;
  slug: string;
  title?: string;
  publishedAt?: string | null;
}) {
  const media = await getArticleMedia(input.articleId);
  const resolvedRemote = await resolveArticleHeroImage({
    image_url: input.currentImageUrl ?? null,
    media,
    preferMedia: input.preferMedia
  });
  const resolved = await importArticleImageToSite({
    imageUrl: resolvedRemote,
    slug: input.slug,
    title: input.title,
    publishedAt: input.publishedAt
  });

  if (!resolved || resolved === input.currentImageUrl) {
    return { updated: false, image_url: input.currentImageUrl ?? null };
  }

  const { error } = await supabase
    .from("articles")
    .update({ image_url: resolved, updated_at: new Date().toISOString() })
    .eq("id", input.articleId);

  if (error) {
    throw new Error(`Failed to sync localized article hero image: ${error.message}`);
  }

  return { updated: true, image_url: resolved };
}
