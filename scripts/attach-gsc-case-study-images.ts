import { replaceArticleImageMedia } from "../lib/article-media";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

const CASE_STUDY_SLUG =
  "case-study-how-we-tanked-search-impressions-during-adsense-review-and-cleaned-it-up";

async function main() {
  const { data: article, error } = await supabase
    .from("articles")
    .select("id,slug,title,category")
    .eq("slug", CASE_STUDY_SLUG)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load case study article: ${error.message}`);
  }

  if (!article) {
    throw new Error(`Published case study not found for slug ${CASE_STUDY_SLUG}`);
  }

  const imageRows = [
    {
      providerId: "gsc:web-search:3m",
      title: "GSC web search performance (3 months)",
      imageUrl: "/generated/case-study-gsc-web-search-3m.png",
      thumbnailUrl: "/generated/case-study-gsc-web-search-3m.png",
      altText:
        "Google Search Console web search performance over three months showing 1.92K impressions, 13 clicks, 0.7 percent CTR, and declining impressions.",
      caption:
        "Web search (3-month view): impressions and clicks declined after review-mode indexing restrictions.",
      sourceName: "Google Search Console",
      sourceUrl: "https://search.google.com/search-console"
    },
    {
      providerId: "gsc:image-search:3m",
      title: "GSC image search performance (3 months)",
      imageUrl: "/generated/case-study-gsc-image-search-3m.png",
      thumbnailUrl: "/generated/case-study-gsc-image-search-3m.png",
      altText:
        "Google Search Console image search performance over three months showing 2.08K impressions, 2 clicks, and a brief spike followed by near-flat visibility.",
      caption:
        "Image search (3-month view): short peak then near-flat visibility, used as baseline before recovery.",
      sourceName: "Google Search Console",
      sourceUrl: "https://search.google.com/search-console"
    }
  ];

  const replaced = await replaceArticleImageMedia(article.id, imageRows);

  await revalidateSiteCache({
    paths: ["/", "/seo", `/seo/${article.slug}`],
    tags: ["articles"]
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: article.slug,
        replaced
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[attach-gsc-case-study-images] Failed", error);
  process.exitCode = 1;
});
