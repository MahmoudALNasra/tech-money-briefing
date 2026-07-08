import { loadLocalEnv } from "../lib/load-env";
import { normalizeArticleContent } from "../lib/article-markdown";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";
import { countArticleWords } from "../lib/owner-voice/aeo-content";

loadLocalEnv();

const CASE_STUDY_SLUG =
  "case-study-how-we-tanked-search-impressions-during-adsense-review-and-cleaned-it-up";

const content = normalizeArticleContent(`I made a mistake that looked safe for AdSense and expensive for SEO.

We tightened review mode, hid utility paths, and cut the published corpus fast. It looked disciplined from an operations view. In [Google Search Console](https://search.google.com/search-console), it looked like a traffic cliff.

## Quick Answer

If you are preparing for AdSense, do not block the exact URLs that still earn impressions. Use review mode for content quality and trust-page polish, but keep high-intent pages indexable. We cleaned the corpus from 140 published pages to 92 stronger pages and removed low-value patterns from live URLs, which helped more than broad noindex blocks.

## What the GSC query export showed

The 3-month Web export showed clear buyer-intent demand, even with weak rankings.

| Query | Impressions | Clicks | Avg position |
| --- | ---: | ---: | ---: |
| cloudflare vs cloudfront | 62 | 0 | 65.15 |
| matomo vs google analytics | 61 | 0 | 63.62 |
| snowflake vs bigquery | 45 | 0 | 76.02 |
| aws vs cloudflare | 43 | 0 | 82.47 |
| screaming frog vs sitebulb | 28 | 0 | 48.50 |
| plausible vs google analytics | 28 | 0 | 65.25 |

Demand existed. We simply made it harder for Google to keep serving our strongest intent set.

## What the page export confirmed

Page-level data said the same thing: compare pages were carrying visibility, but CTR was near zero because rankings were deep and indexing signals were constrained.

| Page | Impressions | Clicks | Avg position |
| --- | ---: | ---: | ---: |
| /compare/cloudflare-vs-aws-cloudfront | 149 | 0 | 71.23 |
| /compare/snowflake-vs-bigquery | 112 | 0 | 80.47 |
| /compare/matomo-vs-google-analytics | 79 | 0 | 60.25 |
| /compare/google-workspace-vs-zoho | 78 | 0 | 64.28 |
| /compare/google-analytics-vs-plausible | 67 | 0 | 68.91 |
| /compare/screaming-frog-vs-sitebulb | 30 | 0 | 47.17 |

The data did not suggest random volatility. It suggested we were suppressing exactly the pages we should have improved.

## The root cause we created

We audited live robots and response headers and found:

- Disallow: /compare
- Disallow: /tools
- X-Robots-Tag: noindex, follow on comparison URLs

That is not a ranking tweak. That is an indexing brake.

## Cleanup actions and outcomes

We shifted from broad blocking to quality-focused cleanup:

- drafted weak and off-topic pages
- removed AI-template magnet phrases from published content
- repaired link formatting and markdown hygiene
- rewrote short core pages before review

| Quality metric | Before | After |
| --- | ---: | ---: |
| Published articles | 140 | 92 |
| Published in others | 19 | 0 |
| AI-pattern flagged published pages | 8 | 0 |
| Published pages under 250 words | 23 | 0 |

This is the change that improved trust posture for both reviewers and readers.

## What changed in operating mode

The durable fix was split operations:

- keep editorial review controls active
- keep high-intent pages indexable
- keep trust pages strong (About, Contact, Editorial Policy, Privacy, Terms)
- request indexing only after technical and content checks are clean

We also shifted toward owner-voice briefings and fewer generic trend summaries. For teams in the same position, our practical guide on [how long until your site appears in Google](https://techrevenuebrief.com/seo/how-long-until-your-site-appears-in-google-search-results) reflects the same operational model we now use.

## What we would do earlier next time

Use Search Console exports as a release gate before changing robots, noindex, or corpus size. If your top impression pages are still viable, protect them first, then clean quality in parallel.

Quality and indexability can coexist. Blocking first and cleaning later is where we lost time.`);

async function main() {
  const words = countArticleWords(content);
  const { error } = await supabase
    .from("articles")
    .update({
      content,
      updated_at: new Date().toISOString()
    })
    .eq("slug", CASE_STUDY_SLUG)
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to update case study content: ${error.message}`);
  }

  await revalidateSiteCache({
    paths: ["/", "/seo", `/seo/${CASE_STUDY_SLUG}`],
    tags: ["articles"]
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: CASE_STUDY_SLUG,
        words
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[update-gsc-case-study-with-tables] Failed", error);
  process.exitCode = 1;
});
