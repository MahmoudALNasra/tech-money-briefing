/**
 * Publish curated draft articles in /others so the category feed is not empty.
 * Usage: npm run articles:publish-others-curated
 *        npm run articles:publish-others-curated -- --dry-run
 *        npm run articles:publish-others-curated -- --auto --limit=8
 */

import {
  scoreArticleForAdsenseRetention,
  shouldHideArticleForAdsense
} from "../lib/adsense-readiness";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

const MIN_WORDS = 450;

const DEFAULT_CURATED_SLUGS = [
  "understanding-the-ai-bubble-what-you-need-to-know",
  "how-mcdonald-s-drive-thru-ai-upgrade-is-transforming-customer-experience",
  "understanding-snow-stock-what-you-need-to-know-about-investing-in-snowflake-and-related-st",
  "understanding-the-anthropic-ipo-what-investors-need-to-know",
  "fitbit-air-the-new-contender-in-health-tracking-wearables",
  "the-resurgence-of-interest-in-jfk-jr-what-it-means-for-publishers-and-creators",
  "what-you-need-to-know-about-youtube-tv-pricing-channels-and-features",
  "blue-origin-what-you-need-to-know-about-the-latest-developments",
  "everything-you-need-to-know-about-stellar-blade-release-date-gameplay-and-features"
] as const;

const AUTO_REJECT_PATTERNS = [
  /\b(nhl|nba|nfl|mlb|mls|ipl|ufc|soccer|baseball|basketball|tennis|world cup)\b/i,
  /\bvs\.?\b/i,
  /\b(highlights|matchup|game preview|showdown|playoff|qualifier)\b/i,
  /\b(divorce|shooting|earthquake|arrested|passed away|celebrity)\b/i
] as const;

const AUTO_ACCEPT_PATTERNS =
  /\b(ai|anthropic|claude|chatgpt|saas|startup|adsense|seo|shopify|stripe|analytics|newsletter|creator|fintech|snowflake|ipo|bubble|wearable|publisher|youtube tv|drive-thru|mcdonald|blue origin)\b/i;

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSlugListArg() {
  const prefix = "--slugs=";
  const arg = process.argv.find((value) => value.startsWith(prefix));

  if (!arg) {
    return null;
  }

  return arg
    .slice(prefix.length)
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function countWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function passesAutoCurator(article: {
  title: string;
  content: string;
  meta_description: string;
}) {
  const blob = `${article.title} ${article.meta_description} ${article.content.slice(0, 600)}`;

  if (AUTO_REJECT_PATTERNS.some((pattern) => pattern.test(blob))) {
    return false;
  }

  return AUTO_ACCEPT_PATTERNS.test(blob);
}

async function loadDraftOthersArticles() {
  const pageSize = 200;
  const rows: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    source_name: string;
    source_url: string | null;
    image_url: string | null;
    content: string;
    meta_description: string;
  }> = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id,title,slug,category,source_name,source_url,image_url,content,meta_description"
      )
      .eq("category", "others")
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to load others drafts: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const auto = process.argv.includes("--auto");
  const limit = getNumberArg("limit", 10);
  const slugList = getSlugListArg();
  const drafts = await loadDraftOthersArticles();

  let candidates: Array<{
    article: (typeof drafts)[number];
    score: number;
    words: number;
  }>;

  if (auto) {
    candidates = drafts
      .map((article) => ({
        article,
        score: scoreArticleForAdsenseRetention(article),
        words: countWords(article.content ?? "")
      }))
      .filter(
        ({ article, score, words }) =>
          !shouldHideArticleForAdsense(article) &&
          passesAutoCurator(article) &&
          score > 0 &&
          words >= MIN_WORDS &&
          Boolean(article.image_url?.trim())
      )
      .sort((left, right) => right.score - left.score || right.words - left.words)
      .slice(0, limit);
  } else {
    const targetSlugs = slugList ?? [...DEFAULT_CURATED_SLUGS];
    const bySlug = new Map(drafts.map((article) => [article.slug, article]));

    candidates = targetSlugs
      .map((slug) => bySlug.get(slug))
      .filter((article): article is NonNullable<typeof article> => Boolean(article))
      .map((article) => ({
        article,
        score: scoreArticleForAdsenseRetention(article),
        words: countWords(article.content ?? "")
      }));
  }

  if (candidates.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun,
          published: 0,
          message: "No eligible others drafts found to publish."
        },
        null,
        2
      )
    );
    return;
  }

  const publishedAt = new Date().toISOString();
  const published: Array<{ slug: string; title: string; score: number }> = [];

  for (const candidate of candidates) {
    if (dryRun) {
      published.push({
        slug: candidate.article.slug,
        title: candidate.article.title,
        score: candidate.score
      });
      continue;
    }

    const { error } = await supabase
      .from("articles")
      .update({
        status: "published",
        published_at: publishedAt,
        updated_at: publishedAt
      })
      .eq("id", candidate.article.id);

    if (error) {
      throw new Error(
        `Failed to publish ${candidate.article.slug}: ${error.message}`
      );
    }

    published.push({
      slug: candidate.article.slug,
      title: candidate.article.title,
      score: candidate.score
    });
  }

  if (!dryRun && published.length > 0) {
    await revalidateSiteCache({
      paths: [
        "/",
        "/others",
        ...published.map((article) => `/others/${article.slug}`)
      ],
      tags: ["articles"]
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        mode: auto ? "auto" : "curated",
        published: published.length,
        articles: published
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[publish-others-curated] Failed", error);
  process.exitCode = 1;
});
