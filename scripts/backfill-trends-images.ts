import { fetchOpenGraphImage } from "../lib/ingestion";
import { loadLocalEnv } from "../lib/load-env";
import { supabase } from "../lib/supabase";

loadLocalEnv();

type TrendSearchItem = {
  keyword?: string;
  articleKeys?: Array<[number, string, string]>;
};

type TrendSearchArticle = {
  url?: string;
  image?: string;
};

function isGoogleThumbnail(url: string | null | undefined) {
  return Boolean(url?.includes("encrypted-tbn"));
}

function isUsableImage(url: string | null | undefined) {
  return Boolean(url && !isGoogleThumbnail(url));
}

function trendKeywordFromUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname !== "trends.google.com") {
      return null;
    }

    return parsed.searchParams.get("q")?.toLowerCase().trim() ?? null;
  } catch {
    return null;
  }
}

async function loadTrendArticleKeys() {
  const { trendingNow } = await import("trendsearch");
  const result = await trendingNow({
    geo: process.env.GOOGLE_TRENDS_GEO ?? "US",
    language: process.env.GOOGLE_TRENDS_LANGUAGE ?? "en",
    hours: 24
  });
  const items = (result.data.items ?? []) as TrendSearchItem[];

  return new Map(
    items
      .filter((item) => item.keyword && item.articleKeys?.length)
      .map((item) => [item.keyword!.toLowerCase().trim(), item.articleKeys!])
  );
}

async function fetchTrendArticleImage(articleKeys: Array<[number, string, string]>) {
  const { trendingArticles } = await import("trendsearch");
  const result = await trendingArticles({
    articleKeys: articleKeys.slice(0, 5),
    articleCount: 5
  });
  const articles = (result.data.articles ?? []) as TrendSearchArticle[];

  for (const article of articles) {
    if (!article.url) {
      continue;
    }

    const openGraphImage = await fetchOpenGraphImage(article.url);

    if (isUsableImage(openGraphImage)) {
      return openGraphImage;
    }

    if (isUsableImage(article.image)) {
      return article.image;
    }
  }

  return null;
}

async function backfillTrendImages() {
  const trendArticleKeys = await loadTrendArticleKeys();
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,source_url,image_url")
    .eq("category", "others")
    .ilike("source_name", "Google Trends%");

  if (error) {
    throw new Error(`Failed to load trend articles: ${error.message}`);
  }

  const result = {
    checked: data?.length ?? 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const article of data ?? []) {
    if (isUsableImage(article.image_url)) {
      result.skipped += 1;
      continue;
    }

    try {
      const keyword = trendKeywordFromUrl(article.source_url);
      const articleKeys = keyword ? trendArticleKeys.get(keyword) : null;
      const imageUrl = articleKeys
        ? await fetchTrendArticleImage(articleKeys)
        : await fetchOpenGraphImage(article.source_url);

      if (!isUsableImage(imageUrl) || imageUrl === article.image_url) {
        result.skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update({ image_url: imageUrl })
        .eq("id", article.id);

      if (updateError) {
        throw updateError;
      }

      result.updated += 1;
    } catch (error) {
      result.errors.push(
        `${article.title}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

backfillTrendImages().catch((error) => {
  console.error("[trends:backfill-images] Failed", error);
  process.exitCode = 1;
});
