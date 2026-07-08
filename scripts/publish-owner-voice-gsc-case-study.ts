import {
  articleExistsBySourceUrl,
  createUniqueShareId,
  createUniqueSlug
} from "../lib/article-publish";
import { loadLocalEnv } from "../lib/load-env";
import { normalizeArticleContent } from "../lib/article-markdown";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

loadLocalEnv();

const sourceUrl = "owner-voice-case-study://gsc-adsense-review-recovery-2026-06";

const article = {
  title: "Case Study: How We Tanked Search Impressions During AdSense Review and Cleaned It Up",
  category: "seo",
  meta_description:
    "A real owner-voice case study on how an AdSense review setup blocked high-intent pages, what the Search Console data showed, and what we changed to recover.",
  key_takeaways: [
    "Our biggest search demand lived in comparison pages, and we accidentally blocked those URLs during AdSense review prep.",
    "A quality cleanup helped AdSense readiness more than broad site blocking: we drafted low-value pages and removed AI-pattern content from published URLs.",
    "The practical fix was split-mode review operations: keep editorial cleanup on, but keep high-intent SEO pages indexable."
  ],
  content: normalizeArticleContent(`I made a mistake that looked "safe" for AdSense and expensive for SEO.

We tightened review mode, hid utility paths, and cut the published corpus hard. On paper that looked like discipline. In [Google Search Console](https://search.google.com/search-console), it looked like a traffic cliff.

## Quick Answer

If you are preparing for AdSense, do not block the exact URLs that still earn impressions. Use review mode for content quality and trust-page polish, but keep your high-intent pages indexable. We cleaned our corpus from 140 published pages to 92 stronger pages while removing AI-pattern content, and that did more for readiness than noindex blocks.

## What the GSC export showed

From the CSV export window we analyzed:

- Total impressions: **2,296**
- Total clicks: **14**
- Site CTR: **0.61%**
- Comparison URLs alone: **670 impressions** (about **29.2%** of total)

The top impression terms were comparison intent:

- "cloudflare vs cloudfront"
- "matomo vs google analytics"
- "snowflake vs bigquery"

Demand was clear, even with weak rankings.

## The root cause we created

We reviewed live robots and headers and found we had:

- Disallow: /compare
- Disallow: /tools
- X-Robots-Tag: noindex, follow on comparison pages

That means we did not just rank poorly. We removed our best-intent URLs from normal indexing signals while waiting on AdSense.

I have seen teams call this a "Google volatility issue." In our case it was operational. We blocked our own route to recovery.

## The quality cleanup that mattered for review

We then ran a stricter cleanup aligned with AdSense quality expectations:

- drafted weak/off-topic published pages down to a cleaner corpus
- removed residual AI-template patterns from published pages
- repaired owner-voice link artifacts and malformed markdown
- rewrote short core pages so published content was no longer thin

After cleanup, published quality checks landed at:

- **92 published pages**
- **0** published pages in others
- **0** published pages with our AI-detector magnet patterns
- **0** published pages with broken markdown links
- **0** published pages under 250 words in the active corpus

That is a much stronger trust profile than a large noisy corpus.

## What we changed in operating mode

The durable fix was not "turn everything off" or "turn everything on."

We moved toward split behavior:

- keep editorial review controls active
- keep high-intent pages indexable
- keep trust pages strong (About, Contact, Editorial Policy, Privacy, Terms)
- request indexing for top pages after technical fixes

We also started writing more specific owner-voice pieces and fewer generic trend summaries. For teams dealing with indexing delays, this guide on [how long until your site appears in Google](https://techrevenuebrief.com/seo/how-long-until-your-site-appears-in-google-search-results) is the same practical mindset we now apply to every publish decision.

## What this case study changed for us

AdSense review and SEO are not enemies, but they fail together when you optimize the wrong layer. Quality and clarity help both. Blanket blocking does not.

Protect indexability for high-intent pages, clean the corpus aggressively, and let data from Search Console drive what stays live.`)
};

async function main() {
  const exists = await articleExistsBySourceUrl(sourceUrl);
  if (exists) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          reason: "already published",
          sourceUrl
        },
        null,
        2
      )
    );
    return;
  }

  const slug = await createUniqueSlug(article.title);
  const shareId = await createUniqueShareId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("articles").insert({
    title: article.title,
    slug,
    content: article.content,
    meta_description: article.meta_description,
    key_takeaways: article.key_takeaways,
    category: article.category,
    source_name: "Tech Revenue Brief Editors",
    source_url: sourceUrl,
    image_url: null,
    share_id: shareId,
    status: "published",
    published_at: now,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(`Failed to publish case study: ${error.message}`);
  }

  try {
    await revalidateSiteCache({
      paths: ["/", "/seo", `/seo/${slug}`],
      tags: ["articles"]
    });
  } catch (revalidateError) {
    console.warn("[case-study] Published but cache revalidate failed", revalidateError);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        published: true,
        path: `/seo/${slug}`,
        sourceUrl
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[case-study] Failed", error);
  process.exitCode = 1;
});
