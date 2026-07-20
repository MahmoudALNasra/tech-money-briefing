/**
 * Publish curated owner-voice articles aimed at top GSC impression queries.
 * Usage: npm run articles:publish-owner-voice-recovery
 *        npm run articles:publish-owner-voice-recovery -- --dry-run
 */

import { ARTICLE_EDITORIAL_SOURCE_NAME } from "../lib/article-attribution";
import { normalizeArticleContent } from "../lib/article-markdown";
import { enrichArticleMedia } from "../lib/article-media";
import { syncLocalizedArticleHeroImage } from "../lib/article-hero-localization";
import { syncArticleInlineImages } from "../lib/article-inline-images";
import { polishOwnerVoiceLinks } from "../lib/owner-voice/aeo-content";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { generateShareId } from "../lib/share-id";
import { supabase } from "../lib/supabase";

loadLocalEnv();

type OwnerVoiceArticle = {
  slug: string;
  category: string;
  title: string;
  meta_description: string;
  key_takeaways: string[];
  source_url: string;
  content: string;
};

const ARTICLES: OwnerVoiceArticle[] = [
  {
    slug: "cloudflare-vs-aws-cloudfront-what-i-check-before-picking-a-cdn",
    category: "seo",
    title: "Cloudflare vs AWS CloudFront: What I Check Before Picking a CDN",
    meta_description:
      "A practical Cloudflare vs CloudFront checklist for operators: cache control, pricing surprises, WAF fit, and when AWS lock-in is worth it.",
    key_takeaways: [
      "Pick Cloudflare when you want fast setup, WAF defaults, and edge features without living inside AWS billing.",
      "Pick CloudFront when your origin, IAM, and logs already live in AWS and you need tight CloudWatch integration.",
      "Do not switch CDNs on a marketing chart alone. Test cache hit ratio, purge time, and TLS/cert workflow on one real property first."
    ],
    source_url: "editorial://owner-voice/cloudflare-vs-cloudfront-2026-07",
    content: `I would not pick Cloudflare or CloudFront from a feature matrix. Both can make a site faster. The wrong one makes billing, purges, and security rules harder than they need to be.

## Quick Answer

Choose [Cloudflare](https://www.cloudflare.com/) if you want a CDN plus WAF and DNS in one place with less AWS ceremony. Choose [Amazon CloudFront](https://aws.amazon.com/cloudfront/) if your stack is already deep in AWS and you care more about IAM, S3 origins, and CloudWatch than a polished admin UI. Validate with one production-like property before you move traffic.

## What I compare first

I start with four boring checks:

- Where the origin lives today
- Who will touch cache rules after launch
- How purge and rollback work under pressure
- Whether security rules need a separate product

If your site already sits on S3 or behind an ALB, CloudFront often wins on wiring. If you are tired of AWS console hopping and want DNS, CDN, and bot controls together, Cloudflare usually feels cleaner.

## Cache and purge reality

CDN demos love TTFB screenshots. Operators care about bad deploys.

I ask: how fast can we purge a poisoned asset? How do we version hashed JS? Can a junior engineer undo a bad cache rule without paging the whole team? Cloudflare's dashboard is usually faster for that. CloudFront is fine if your team already automates invalidations in CI.

## Pricing surprises

Both look cheap until you misconfigure origin fetch, image transforms, or high-churn APIs. I estimate:

- Bandwidth at expected peak
- Request volume for APIs and HTML
- WAF / bot / image costs as separate lines

Then I add 20% for "we will misconfigure something in month one."

## When I refuse to switch

If the only reason is "everyone says Cloudflare is better," I wait. A CDN migration that breaks cookies, auth headers, or stale HTML is not a win. Run a shadow property, compare cache hit ratio for a week, then cut over.

## Related tools on this site

If you are mapping the decision for content and SEO ops, also check our [compare hub](/compare) and the live [Cloudflare vs AWS CloudFront](/compare/cloudflare-vs-aws-cloudfront) page. For site audits after the move, [Google Search Console](https://search.google.com/search-console) crawl stats matter more than CDN marketing pages.`
  },
  {
    slug: "snowflake-vs-bigquery-how-i-decide-for-a-small-data-team",
    category: "fintech",
    title: "Snowflake vs BigQuery: How I Decide for a Small Data Team",
    meta_description:
      "Snowflake vs BigQuery for small teams: cost control, SQL habits, Google Cloud lock-in, and the checks I run before migrating a warehouse.",
    key_takeaways: [
      "BigQuery wins when your world is already Google Cloud and analysts live in SQL with serverless scale.",
      "Snowflake wins when you need multi-cloud flexibility and clearer warehouse isolation for mixed workloads.",
      "For a small team, the real risk is idle spend and messy modeling, not brand logos."
    ],
    source_url: "editorial://owner-voice/snowflake-vs-bigquery-2026-07",
    content: `I do not start a Snowflake vs BigQuery debate with "which is more modern." For a small data team, the wrong warehouse burns cash while everyone argues about syntax.

## Quick Answer

Pick [BigQuery](https://cloud.google.com/bigquery) if you already run on Google Cloud and want serverless SQL without babysitting clusters. Pick [Snowflake](https://www.snowflake.com/) if you need cleaner workload isolation, multi-cloud options, or clearer separation between finance, product, and marketing workloads. Either way, model cost per useful dashboard, not cost per TB scanned in a demo.

## The small-team failure mode

Tiny teams buy enterprise warehouse dreams, then leave warehouses idle or let every analyst run unbounded queries. The tool did not fail. The operating model did.

Before I migrate, I ask:

- Who owns cost alerts?
- What is the top 10 query set by spend?
- Which dashboards would survive if we deleted half the tables?

If nobody can answer, I do not migrate. I clean house first.

## When BigQuery is the practical choice

BigQuery is hard to beat if your ingestion already lands in GCS, your auth is Google Workspace, and analysts are comfortable with GoogleSQL. Less infrastructure theater. More "write the query and ship."

Watch slot/reservation choices and accidental SELECT * over wide event tables. Those two create most of the surprise bills I see.

## When Snowflake is the practical choice

Snowflake earns its keep when teams need separate warehouses for ETL vs BI, or when data must stay portable across clouds. Finance likes the isolation story. Engineering likes not sharing one giant queue with every dashboard refresh.

It is not free of complexity. Role design and warehouse sizing still need an owner.

## My decision test

I run the same three workloads in both for a week if possible:

1. Nightly transform job
2. Peak BI refresh window
3. One messy ad-hoc investigation query

Winner = better cost per successful job with less babysitting. Not prettier docs.

## Next step

If you are comparing stacks for operators, see [Snowflake vs BigQuery](/compare/snowflake-vs-bigquery) on our compare hub. Pair the warehouse choice with tracking hygiene in [Google Analytics](https://analytics.google.com/) so marketing and finance are not arguing from different numbers.`
  },
  {
    slug: "google-analytics-vs-plausible-when-i-keep-ga4-and-when-i-add-plausible",
    category: "digital-marketing",
    title: "Google Analytics vs Plausible: When I Keep GA4 and When I Add Plausible",
    meta_description:
      "GA4 vs Plausible for operators: privacy, debugging, ad attribution, and when a lightweight analytics tool is enough for a publishing site.",
    key_takeaways: [
      "Keep GA4 when you need ads attribution, Search Console linking, and ecommerce event depth.",
      "Add Plausible when you want clean, privacy-friendly traffic trends without training every teammate on GA4 reports.",
      "Do not delete GA4 on vibes. Run both for a month and compare decisions you can actually make."
    ],
    source_url: "editorial://owner-voice/ga4-vs-plausible-2026-07",
    content: `People ask me to "just switch to Plausible" like analytics is a brand preference. It is not. It is a decision about which questions you need answered every week.

## Quick Answer

Keep [Google Analytics 4](https://analytics.google.com/) if you run ads, need Search Console integration, or depend on ecommerce events. Add [Plausible](https://plausible.io/) when you want simple, privacy-friendly traffic views your team will actually open. For many publisher sites, the winning setup is GA4 for money paths and Plausible for sanity.

## What GA4 is still good at

GA4 is messy, but it still wins when you need:

- Google Ads attribution
- Funnel events for signup or checkout
- [Search Console](https://search.google.com/search-console) linking
- Audience building for remarketing

If those are on your roadmap, deleting GA4 is usually a future headache.

## Where Plausible feels better

Plausible is what I show non-analyst teammates. Visits, sources, top pages. No exploration UI rabbit hole. Cookie banner pressure is lower. That alone can improve how often people look at traffic.

It will not replace ad attribution. Do not pretend it will.

## The dual-stack approach I use

On content sites, I often run both for 30 days:

- Plausible for daily "what moved?"
- GA4 for campaign and conversion diagnosis

Then I ask one question: which tool changed a decision this month? Keep that one front and center. Demote the other.

## GA4 lag is not a reason to panic

Realtime and reporting delays make people think GA4 is broken. Sometimes it is config. Sometimes it is just how the product works. I wrote through that separately for operators chasing "Google Analytics problems" queries. Fix measurement before you rip out the stack.

## Practical next step

Compare the product pages at [Google Analytics vs Plausible](/compare/google-analytics-vs-plausible), then decide from your actual weekly questions, not Twitter takes. If ads pay the bills, GA4 stays. If you only need honest traffic trends for editorial, Plausible can be enough.`
  }
];

async function publishOne(article: OwnerVoiceArticle, dryRun: boolean) {
  const polished = polishOwnerVoiceLinks(article.content, {
    category: article.category
  });
  const content = normalizeArticleContent(polished);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", article.slug)
    .maybeSingle();

  if (dryRun) {
    return {
      slug: article.slug,
      category: article.category,
      title: article.title,
      wordCount,
      action: existing ? "would_update" : "would_insert"
    };
  }

  const publishedAt = new Date().toISOString();
  const payload = {
    title: article.title,
    slug: article.slug,
    content,
    meta_description: article.meta_description,
    key_takeaways: article.key_takeaways,
    category: article.category,
    source_name: ARTICLE_EDITORIAL_SOURCE_NAME,
    source_url: article.source_url,
    status: "published",
    published_at: publishedAt,
    updated_at: publishedAt
  };

  let articleId = existing?.id as string | undefined;

  if (articleId) {
    const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
    if (error) {
      throw new Error(`Update failed for ${article.slug}: ${error.message}`);
    }
  } else {
    const { data, error } = await supabase
      .from("articles")
      .insert({
        ...payload,
        share_id: generateShareId(),
        image_url: null
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Insert failed for ${article.slug}: ${error.message}`);
    }

    articleId = data.id as string;
  }

  await enrichArticleMedia({
    articleId,
    title: article.title,
    category: article.category,
    metaDescription: article.meta_description
  });

  await syncLocalizedArticleHeroImage({
    articleId,
    currentImageUrl: null,
    preferMedia: true,
    slug: article.slug,
    title: article.title,
    publishedAt
  });

  try {
    await syncArticleInlineImages({
      articleId,
      slug: article.slug,
      title: article.title,
      category: article.category,
      metaDescription: article.meta_description,
      publishedAt
    });
  } catch (error) {
    console.warn(`[owner-voice-recovery] inline images skipped for ${article.slug}`, error);
  }

  return {
    slug: article.slug,
    category: article.category,
    title: article.title,
    wordCount,
    url: `/${article.category}/${article.slug}`,
    action: existing ? "updated" : "inserted"
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const published = [];

  for (const article of ARTICLES) {
    published.push(await publishOne(article, dryRun));
  }

  if (!dryRun) {
    await revalidateSiteCache({
      paths: [
        "/",
        ...ARTICLES.map((article) => `/${article.category}`),
        ...ARTICLES.map((article) => `/${article.category}/${article.slug}`),
        "/compare"
      ],
      tags: ["articles"]
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        published: published.length,
        articles: published
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[owner-voice-recovery] Failed", error);
  process.exitCode = 1;
});
