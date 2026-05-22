import { cache } from "react";

import { normalizeTakeaways } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Article, ArticleSummary } from "@/lib/types";

function mapArticleSummary(row: Record<string, unknown>): ArticleSummary {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    meta_description: String(row.meta_description),
    key_takeaways: normalizeTakeaways(row.key_takeaways),
    category: String(row.category),
    source_name: String(row.source_name),
    image_url: row.image_url ? String(row.image_url) : null,
    share_id: String(row.share_id),
    published_at: row.published_at ? String(row.published_at) : null
  };
}

function mapArticle(row: Record<string, unknown>): Article {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    content: String(row.content),
    meta_description: String(row.meta_description),
    key_takeaways: normalizeTakeaways(row.key_takeaways),
    category: String(row.category),
    source_name: String(row.source_name),
    source_url: String(row.source_url),
    image_url: row.image_url ? String(row.image_url) : null,
    share_id: String(row.share_id),
    status: row.status as Article["status"],
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined
  };
}

const articleSummaryColumns =
  "id,title,slug,meta_description,key_takeaways,category,source_name,image_url,share_id,published_at";

export const getPublishedArticles = cache(async (limit = 48) => {
  const { data, error } = await supabase
    .from("articles")
    .select(articleSummaryColumns)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(formatSupabaseError("Failed to load published articles", error));
  }

  return (data ?? []).map((row) =>
    mapArticleSummary(row as Record<string, unknown>)
  );
});

export const getArticlesByCategory = cache(
  async (category: string, limit = 48) => {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSummaryColumns)
      .eq("status", "published")
      .eq("category", category)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load category articles: ${error.message}`);
    }

    return (data ?? []).map((row) =>
      mapArticleSummary(row as Record<string, unknown>)
    );
  }
);

export const getArticleBySlug = cache(
  async (category: string, slug: string) => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("category", category)
      .eq("slug", slug)
      .single();

    if (error) {
      return null;
    }

    return mapArticle(data as Record<string, unknown>);
  }
);

export const getPublishedSitemapEntries = cache(async () => {
  const { data, error } = await supabase
    .from("articles")
    .select("slug,category,updated_at,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50000);

  if (error) {
    throw new Error(`Failed to load sitemap entries: ${error.message}`);
  }

  return data ?? [];
});

export const getPublishedCategories = cache(async () => {
  const { data, error } = await supabase
    .from("articles")
    .select("category")
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return Array.from(new Set((data ?? []).map((row) => row.category))).sort();
});

function formatSupabaseError(context: string, error: { message: string }) {
  const hint =
    error.message.includes("fetch failed")
      ? " Check .env.local: SUPABASE_URL must be https://YOUR_REF.supabase.co and keys must be full JWTs from Supabase → Project Settings → API (not placeholders)."
      : "";

  return `${context}: ${error.message}.${hint}`;
}
