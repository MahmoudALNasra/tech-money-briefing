import { CORE_CATEGORIES } from "@/lib/categories";
import { normalizeTakeaways } from "@/lib/format";
import {
  buildArticleSocialPostBodies,
  type ArticleSocialPostBodies
} from "@/lib/article-social-promotion";
import { buildArticleSocialPostBodiesWithOwnerVoice } from "@/lib/owner-voice/article-social";
import { articleUrl } from "@/lib/seo";
import { supabase } from "@/lib/supabase";

export type ArticlePromotionRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  meta_description: string;
  key_takeaways: string[];
  published_at: string | null;
  url: string;
  published_on_instagram_at: string | null;
  published_on_linkedin_at: string | null;
};

export type ArticlePromotionCategoryGroup = {
  category: string;
  articles: ArticlePromotionRow[];
};

export type ArticlePromotionDetail = ArticlePromotionRow &
  ArticleSocialPostBodies & {
    usedOwnerVoice?: boolean;
  };

function mapPromotionRow(row: Record<string, unknown>): ArticlePromotionRow {
  const category = String(row.category);
  const slug = String(row.slug);

  return {
    id: String(row.id),
    title: String(row.title),
    slug,
    category,
    meta_description: String(row.meta_description),
    key_takeaways: normalizeTakeaways(row.key_takeaways),
    published_at: row.published_at ? String(row.published_at) : null,
    url: articleUrl({ category, slug }),
    published_on_instagram_at: row.published_on_instagram_at
      ? String(row.published_on_instagram_at)
      : null,
    published_on_linkedin_at: row.published_on_linkedin_at
      ? String(row.published_on_linkedin_at)
      : null
  };
}

export async function listArticlePromotionsByCategory(): Promise<{
  categories: ArticlePromotionCategoryGroup[];
  totalArticles: number;
}> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id,title,slug,category,meta_description,key_takeaways,published_at,published_on_instagram_at,published_on_linkedin_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load article promotions: ${error.message}`);
  }

  const articles = (data ?? []).map((row) =>
    mapPromotionRow(row as Record<string, unknown>)
  );

  const byCategory = new Map<string, ArticlePromotionRow[]>();

  for (const article of articles) {
    const bucket = byCategory.get(article.category) ?? [];
    bucket.push(article);
    byCategory.set(article.category, bucket);
  }

  const orderedCategories = [
    ...CORE_CATEGORIES.filter((category) => byCategory.has(category)),
    ...Array.from(byCategory.keys()).filter(
      (category) => !CORE_CATEGORIES.includes(category as (typeof CORE_CATEGORIES)[number])
    )
  ];

  return {
    categories: orderedCategories.map((category) => ({
      category,
      articles: byCategory.get(category) ?? []
    })),
    totalArticles: articles.length
  };
}

export async function getArticlePromotionDetail(
  articleId: string,
  options: { ownerVoice?: boolean } = {}
): Promise<ArticlePromotionDetail | null> {
  const { ownerVoice = true } = options;

  const { data, error } = await supabase
    .from("articles")
    .select(
      "id,title,slug,category,meta_description,key_takeaways,published_at,published_on_instagram_at,published_on_linkedin_at"
    )
    .eq("id", articleId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load article promotion: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = mapPromotionRow(data as Record<string, unknown>);
  const bodies = ownerVoice
    ? await buildArticleSocialPostBodiesWithOwnerVoice(row)
    : { ...buildArticleSocialPostBodies(row), usedOwnerVoice: false };

  return {
    ...row,
    ...bodies
  };
}

export async function setArticlePromotionPosted(input: {
  articleId: string;
  platform: "instagram" | "linkedin";
  published: boolean;
}) {
  const column =
    input.platform === "instagram"
      ? "published_on_instagram_at"
      : "published_on_linkedin_at";

  const { data, error } = await supabase
    .from("articles")
    .update({
      [column]: input.published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.articleId)
    .eq("status", "published")
    .select(
      "id,title,slug,category,meta_description,key_takeaways,published_at,published_on_instagram_at,published_on_linkedin_at"
    )
    .single();

  if (error) {
    throw new Error(`Failed to update article promotion: ${error.message}`);
  }

  return mapPromotionRow(data as Record<string, unknown>);
}
