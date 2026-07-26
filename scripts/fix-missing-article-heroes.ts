/**
 * Backfill missing article image_url from OG sources or first non-SVG media.
 * Usage: node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/fix-missing-article-heroes.ts --slugs=a,b
 */

import { importArticleImageToSite } from "../lib/article-local-images";
import { ensureArticleHeroImageMedia } from "../lib/article-media";
import { fetchOpenGraphImage } from "../lib/ingestion";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

function getSlugList() {
  const prefix = "--slugs=";
  const arg = process.argv.find((value) => value.startsWith(prefix));
  if (!arg) {
    return [] as string[];
  }

  return arg
    .slice(prefix.length)
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

const OG_FALLBACKS: Record<string, string[]> = {
  "everything-you-need-to-know-about-the-new-ghost-rider-movie-starring-ryan-gosling": [
    "https://www.marvel.com/",
    "https://www.imdb.com/title/tt1391634/"
  ],
  "tractor-supply-is-closing-75-underperforming-petsense-retail-locations": [
    "https://corporate.tractorsupply.com/",
    "https://www.tractorsupply.com/"
  ]
};

function isSvg(url: string) {
  return /\.svg($|\?)/i.test(url) || url.includes("image/svg");
}

async function main() {
  const slugs = getSlugList();
  if (slugs.length === 0) {
    throw new Error("Pass --slugs=slug-one,slug-two");
  }

  const fixed = [];

  for (const slug of slugs) {
    const { data: article, error } = await supabase
      .from("articles")
      .select("id,slug,title,published_at,image_url,source_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !article) {
      throw new Error(error?.message || `Missing article ${slug}`);
    }

    let hero: string | null = null;

    const candidates = [
      ...(OG_FALLBACKS[slug] ?? []),
      article.source_url
    ].filter(Boolean) as string[];

    for (const page of candidates) {
      const remote = await fetchOpenGraphImage(page);
      if (!remote || isSvg(remote)) {
        continue;
      }

      hero = await importArticleImageToSite({
        imageUrl: remote,
        slug: article.slug,
        title: article.title,
        publishedAt: article.published_at
      });

      if (hero) {
        break;
      }
    }

    if (!hero) {
      const { data: media } = await supabase
        .from("article_media")
        .select("url,thumbnail_url")
        .eq("article_id", article.id)
        .eq("provider", "image")
        .order("position", { ascending: true });

      const pick = (media ?? []).find((row) => {
        const url = (row.url || row.thumbnail_url || "").trim();
        return url && !isSvg(url);
      });

      hero = (pick?.url || pick?.thumbnail_url || null) as string | null;
    }

    if (!hero) {
      fixed.push({ slug, updated: false, reason: "no raster image found" });
      continue;
    }

    await supabase
      .from("articles")
      .update({ image_url: hero, updated_at: new Date().toISOString() })
      .eq("id", article.id);

    await ensureArticleHeroImageMedia({
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      imageUrl: hero
    });

    fixed.push({ slug, updated: true, image_url: hero });
  }

  await revalidateSiteCache({
    paths: ["/", "/others", ...fixed.map((row) => `/others/${row.slug}`)],
    tags: ["articles"]
  });

  console.log(JSON.stringify({ ok: true, fixed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
