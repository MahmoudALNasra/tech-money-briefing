import {
  buildArticleSocialPostBodies,
  type ArticleSocialPostBodies
} from "@/lib/article-social-promotion";
import type { ArticlePromotionRow } from "@/lib/article-promotions";
import { applyArticlePromotionSocialCopy } from "@/lib/owner-voice/article-promotion-social";

function ensureArticleUrl(body: string, url: string) {
  if (body.includes(url)) {
    return body.trim();
  }

  return `${body.trim()}\n\n${url}`;
}

function ensureHashtagBlock(body: string, hashtags: string[]) {
  const normalized = body.trim();
  const missing = hashtags.filter(
    (tag) => !normalized.toLowerCase().includes(tag.toLowerCase())
  );

  if (missing.length === 0) {
    return normalized;
  }

  return `${normalized}\n\n${missing.join(" ")}`;
}

export type ArticleSocialPostBodiesResult = ArticleSocialPostBodies & {
  usedOwnerVoice: boolean;
};

export async function buildArticleSocialPostBodiesWithOwnerVoice(
  article: ArticlePromotionRow
): Promise<ArticleSocialPostBodiesResult> {
  const template = buildArticleSocialPostBodies(article);

  try {
    const drafted = await applyArticlePromotionSocialCopy({
      article,
      keywords: template.keywords
    });

    return {
      url: template.url,
      keywords: template.keywords,
      hashtags: template.hashtags,
      linkedin: ensureArticleUrl(drafted.linkedin_draft, article.url),
      instagram: ensureHashtagBlock(
        ensureArticleUrl(drafted.instagram_caption, article.url),
        template.hashtags
      ),
      usedOwnerVoice: true
    };
  } catch (error) {
    console.warn(
      "[article-social] Owner voice generation failed; using template copy.",
      error instanceof Error ? error.message : error
    );

    return {
      ...template,
      usedOwnerVoice: false
    };
  }
}
