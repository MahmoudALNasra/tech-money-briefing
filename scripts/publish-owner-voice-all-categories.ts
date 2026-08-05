/**
 * Publish one less-AI owner-voice article per core category (not /others).
 * Usage: npm run articles:publish-owner-voice-all-categories
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
import { fetchOpenGraphImage } from "../lib/ingestion";
import { importArticleImageToSite } from "../lib/article-local-images";

loadLocalEnv();

type OwnerVoiceArticle = {
  slug: string;
  category: string;
  title: string;
  meta_description: string;
  key_takeaways: string[];
  source_url: string;
  content: string;
  imageSourceUrl?: string;
};

const ARTICLES: OwnerVoiceArticle[] = [
  {
    slug: "i-stopped-chasing-new-ai-tools-every-monday-heres-the-boring-stack-i-kept",
    category: "ai-tools",
    title: "I Stopped Chasing New AI Tools Every Monday. Here's the Boring Stack I Kept",
    meta_description:
      "A practical AI tools stack for operators tired of launch FOMO: what I kept, what I deleted, and the weekly checks that actually matter.",
    key_takeaways: [
      "Keep one writing model, one coding assistant, and one research tab. Kill the rest for 30 days.",
      "If a tool doesn't cut edit time on real work in week one, it's entertainment.",
      "Track cost per finished task, not cost per token."
    ],
    source_url: "editorial://owner-voice/ai-tools-boring-stack-2026-08",
    imageSourceUrl: "https://www.anthropic.com/",
    content: `I had seventeen AI bookmarks by March. Half of them needed a new login every time OpenAI, Anthropic, or Google shipped a badge. None of them made Friday quieter.

## Quick Answer

Pick one default chat model, one coding helper, and one search/research tool. Run the same five work tasks for two weeks. Keep what lowers edit time. Delete the rest without a funeral.

## The Monday FOMO tax

I'd open [ChatGPT](https://chatgpt.com/), then [Claude](https://claude.ai/), then whatever launched on Product Hunt. Same prompt. Slightly different tone. Same rewrite afterward.

The cost wasn't the subscription. It was context switching. I'd lose twenty minutes deciding which window "felt smarter."

## What survived

- [ChatGPT](https://chatgpt.com/) for messy first drafts and spreadsheet talk
- [Claude](https://claude.ai/) when the doc is long and I need careful wording
- Cursor (or Copilot) only inside the repo — not as a second chat habit

That's it. No "AI meeting notes" tool until someone else owns the notes.

## The test I use now

Five tasks. Same every week: contract summary, support reply, SOP rewrite, sheet explanation, code note.

I time how long until the output is shippable. If a new model doesn't beat the incumbent by a clear margin twice, it doesn't get a seat.

## What I refuse

I refuse tools that want my whole Google Drive on day one. I refuse "agents" that email customers without a human gate. I refuse another dashboard that shows green scores and no unpaid invoices.

Close the extra tabs. Your stack can be boring and still pay rent.`
  },
  {
    slug: "utm-tags-i-actually-use-after-ruining-a-month-of-ad-reporting",
    category: "digital-marketing",
    title: "UTM Tags I Actually Use After Ruining a Month of Ad Reporting",
    meta_description:
      "A short UTM naming system after a messy GA4 month: campaign, source, medium rules that keep paid and organic reports readable.",
    key_takeaways: [
      "One naming sheet. No freestyle UTMs from freelancers.",
      "source = platform, medium = paid/organic/email, campaign = offer + month.",
      "If two people invent different campaign strings, your report is fiction."
    ],
    source_url: "editorial://owner-voice/utm-tags-2026-08",
    imageSourceUrl: "https://blog.google/products/ads-commerce/",
    content: `Last year I let a contractor invent UTM names. [Google Analytics](https://analytics.google.com/) showed twelve versions of the same Facebook ad. I spent a weekend merging ghosts.

## Quick Answer

Standardize three fields: source, medium, campaign. Write them lowercase with underscores. Put the rules in a shared sheet. Reject any link that doesn't match before it goes live.

## What broke

Someone used \`fb\`, \`facebook\`, and \`Facebook Ads\` in the same month. Medium flipped between \`cpc\`, \`paid\`, and \`paidsocial\`. Campaign names included the client's first name once. Once.

[Search Console](https://search.google.com/search-console) wasn't the problem. My hygiene was.

## Rules that stuck

- source: facebook, google, linkedin, newsletter
- medium: paid, organic, email, referral
- campaign: offer_month — like \`audit_aug26\`

No spaces. No Title Case. No "final_v2_REAL".

Use a [UTM builder](/utm-builder) if people keep improvising. Then audit weekly for junk strings.

## The boring habit

Every Friday I export the last seven days of campaigns and look for duplicates that mean the same click. If I find one, I fix the sheet, not the narrative.

Clean tags won't make bad ads good. Dirty tags will make good ads look random.`
  },
  {
    slug: "i-fixed-three-pages-before-buying-another-seo-suite",
    category: "seo",
    title: "I Fixed Three Pages Before Buying Another SEO Suite",
    meta_description:
      "Before another Semrush or Ahrefs seat, fix cannibalization, thin pages, and internal links. A cheaper SEO order of operations.",
    key_takeaways: [
      "Merge competing URLs before you buy more keyword credits.",
      "Fix titles and internal links on money pages first.",
      "Suites help after the site stops fighting itself."
    ],
    source_url: "editorial://owner-voice/seo-three-pages-2026-08",
    imageSourceUrl: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    content: `I almost renewed a big SEO suite seat because rankings felt stuck. Then I opened [Search Console](https://search.google.com/search-console) and found three URLs swapping for the same query. The suite wasn't going to fix that.

## Quick Answer

Before you pay for another crawler seat, pick your top three money pages. Kill cannibalization, rewrite weak titles, and add internal links from pages that already get impressions. Tools come after the site stops arguing with itself.

## Page one: the twin

Two posts both targeted "keyword cluster." Both mediocre. I merged them into one URL and redirected the loser. Impressions didn't explode overnight. The bounce between twins stopped.

## Page two: the vague title

A title like "SEO Tips for Growth" ranks for nothing useful. I rewrote it around the query people already used in GSC. Same article. Clearer promise.

## Page three: the orphan

Good page. Zero internal links. I added three links from related posts and the category hub. Not fancy. Just findable.

## When suites earn their keep

After that cleanup, [Semrush](https://www.semrush.com/) or [Ahrefs](https://ahrefs.com/) help with gaps and competitors. See [Semrush vs Ahrefs](/compare/semrush-vs-ahrefs) if you're choosing. Buying them to ignore cannibalization is expensive denial.

Fix the three pages. Then shop.`
  },
  {
    slug: "shopify-product-pages-i-wont-launch-until-these-five-lines-exist",
    category: "ecommerce",
    title: "Shopify Product Pages I Won't Launch Until These Five Lines Exist",
    meta_description:
      "A Shopify product page checklist from launch mistakes: who it's for, proof, shipping truth, returns, and one clear CTA.",
    key_takeaways: [
      "Say who the product is for in the first screen.",
      "Put shipping and returns where anxious buyers look.",
      "One primary CTA. Secondary links don't compete with Buy."
    ],
    source_url: "editorial://owner-voice/shopify-product-pages-2026-08",
    imageSourceUrl: "https://www.shopify.com/",
    content: `I launched a [Shopify](https://www.shopify.com/) product once with pretty photos and a poetic description. Support inbox filled with "does this fit a queen mattress?" I had buried the size chart.

## Quick Answer

Don't publish a product page until it states who it's for, what problem it solves, proof someone bought it, shipping/return truth, and one obvious buy button. Pretty copy is optional. Those five aren't.

## The five lines

1. Who it's for — in plain words near the price
2. What changes after they buy — not vibes, outcome
3. Proof — review, photo, or "used by X shops" if true
4. Shipping and returns — above the fold on mobile if you sell physical goods
5. CTA — Buy / Add to cart. Not "Learn more" fighting Buy

## What I cut

I cut metaphor paragraphs. I cut "crafted with passion." I cut three competing buttons.

If you're comparing platforms later, [Shopify vs WooCommerce](/compare/shopify-vs-woocommerce) is fine. First make the page answer the anxious question out loud.

## The 10-minute test

Read the page on your phone in a loud cafe. If you can't tell size, shipping time, and return window without zooming into a FAQ, it's not ready.

Ship the boring clarity. Romance can wait for email flows.`
  },
  {
    slug: "saas-pricing-page-mistakes-that-made-demos-feel-awkward",
    category: "startups",
    title: "SaaS Pricing Page Mistakes That Made Demos Feel Awkward",
    meta_description:
      "Pricing page fixes for early SaaS: clearer tiers, honest limits, and a path for people who aren't ready to talk to sales.",
    key_takeaways: [
      "Name what breaks at each tier in numbers, not adjectives.",
      "Give a self-serve path even if enterprise is the dream.",
      "If sales needs a call to explain the middle tier, the page failed."
    ],
    source_url: "editorial://owner-voice/saas-pricing-mistakes-2026-08",
    imageSourceUrl: "https://stripe.com/",
    content: `I sat on a demo where the prospect asked what "Growth" included. I opened our pricing page and realized I didn't know either. We'd written "advanced automation" three times.

## Quick Answer

Rewrite tiers with numbers: seats, contacts, projects, API calls. Add a cheap self-serve plan. Save "Contact sales" for stuff that actually needs a human. If you can't explain a tier in one breath, rename it or delete it.

## Mistakes that stung

- Adjective tiers: Starter / Growth / Scale with no limits
- Hiding the annual discount until checkout
- Forcing a call for a $29 plan

People aren't dumb. They smell fog.

## What I put on the page now

Each tier gets three bullets max with numbers. A fourth bullet only if it's a real limiter.

I link a [SaaS pricing calculator](/saas-pricing-calculator) when founders are still guessing. Billing choice ([Stripe vs Paddle](/compare/stripe-vs-paddle)) comes after the offer is clear.

## The awkward demo fix

If a prospect asks "what's the difference?" and you paste the page into Zoom, you've already lost. Fix the page before the next call.

Clear prices feel brave. Foggy prices feel like you're hiding.`
  },
  {
    slug: "i-almost-switched-billing-providers-over-one-tax-email",
    category: "fintech",
    title: "I Almost Switched Billing Providers Over One Tax Email",
    meta_description:
      "Stripe vs merchant-of-record thinking after a tax scare: when to stay on Stripe and when Paddle-style MoR is worth the fee.",
    key_takeaways: [
      "One scary tax email isn't a strategy — map volume by country first.",
      "Stripe is fine if someone owns tax config weekly.",
      "MoR fees hurt less than unpaid founder nights on VAT rules."
    ],
    source_url: "editorial://owner-voice/billing-tax-email-2026-08",
    imageSourceUrl: "https://www.paddle.com/",
    content: `The email subject was calm. The body wasn't. Something about VAT registrations I thought we'd handled in [Stripe](https://stripe.com/) Tax. I didn't sleep great.

## Quick Answer

Don't rip out Stripe because one email panicked you. Pull last-quarter revenue by country. If cross-border volume is real and nobody owns tax weekly, price a merchant-of-record option like [Paddle](https://www.paddle.com/). If volume is mostly domestic and you have a finance owner, fix Stripe config and stay.

## What I checked before migrating

- Where buyers actually are
- Current fee drag
- Who answers dispute emails
- Whether checkout customization still matters

Migration week is a product outage with paperwork. Treat it like one.

## When MoR won the spreadsheet

For a small B2C SaaS selling into the EU without a finance hire, MoR fees beat founder nights reading tax posts. For a B2B tool with US-heavy volume and a bookkeeper, Stripe stayed.

Details live on [Stripe vs Paddle](/compare/stripe-vs-paddle). The email was a symptom. Ownership was the disease.

## The rule I kept

Someone's name goes next to "tax config" every Monday. If that name is empty, you're already in migration territory — you just haven't admitted it.`
  },
  {
    slug: "newsletter-monetization-i-wont-pitch-sponsors-until-these-numbers-exist",
    category: "creator-business",
    title: "Newsletter Monetization: I Won't Pitch Sponsors Until These Numbers Exist",
    meta_description:
      "Before sponsor pitches: open rate, click rate, list quality, and a media kit that doesn't apologize. Practical newsletter monetization checks.",
    key_takeaways: [
      "Sponsors buy attention you can prove — opens, clicks, audience fit.",
      "A media kit with vanity subs and no engagement is a soft no.",
      "One honest niche pitch beats five spray-and-pray emails."
    ],
    source_url: "editorial://owner-voice/newsletter-sponsors-2026-08",
    imageSourceUrl: "https://www.beehiiv.com/",
    content: `I pitched a sponsor with "12k subs." They asked for open rate. I mumbled. That was the end of the thread.

## Quick Answer

Don't pitch until you can show 30-day open rate, click rate, audience description, and two past issues. Build the kit before the outreach. Platforms like [Beehiiv](https://www.beehiiv.com/) or [Substack](https://substack.com/) help ship — they don't invent proof.

## Numbers I keep in the kit

- Active subs (not historical signups)
- Avg open rate last 30 days
- Avg click rate last 30 days
- Who reads (job titles / niche), not "everyone interested in tech"

If opens are soft, fix subject lines and list hygiene before you sell inventory. A [newsletter revenue calculator](/newsletter-revenue-calculator) is fine for planning. It's not a pitch.

## Pitch shape that didn't get ignored

One paragraph on the audience. One on results. One on format (logo, copy length, exclusivity). Price. Deadline.

No novel. No "synergy."

Compare [Beehiiv vs Substack](/compare/beehiiv-vs-substack) when you're choosing tools. Proof comes from the list, not the CMS.

## The line I won't cross

I won't sell a dedicated send against a list I wouldn't advertise to my own customers. Short-term cash. Long-term unsubscribe bomb.

Earn the numbers. Then ask.`
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
  let imageUrl: string | null = null;

  if (article.imageSourceUrl) {
    const remote = await fetchOpenGraphImage(article.imageSourceUrl);
    if (remote && !/\.svg($|\?)/i.test(remote)) {
      imageUrl = await importArticleImageToSite({
        imageUrl: remote,
        slug: article.slug,
        title: article.title,
        publishedAt
      });
    }
  }

  const payload = {
    title: article.title,
    slug: article.slug,
    content,
    meta_description: article.meta_description,
    key_takeaways: article.key_takeaways,
    category: article.category,
    source_name: ARTICLE_EDITORIAL_SOURCE_NAME,
    source_url: article.source_url,
    status: "published" as const,
    published_at: publishedAt,
    updated_at: publishedAt,
    image_url: imageUrl
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
        share_id: generateShareId()
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

  const hero = await syncLocalizedArticleHeroImage({
    articleId,
    currentImageUrl: imageUrl,
    preferMedia: true,
    slug: article.slug,
    title: article.title,
    publishedAt
  });

  if (process.env.SKIP_SERPER_IMAGES !== "true") {
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
      console.warn(`[all-categories] inline images skipped for ${article.slug}`, error);
    }
  }

  return {
    slug: article.slug,
    category: article.category,
    title: article.title,
    wordCount,
    image_url: hero.image_url ?? imageUrl,
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
        ...ARTICLES.map((article) => `/${article.category}/${article.slug}`)
      ],
      tags: ["articles"]
    });
  }

  console.log(
    JSON.stringify({ ok: true, dryRun, published: published.length, articles: published }, null, 2)
  );
}

main().catch((error) => {
  console.error("[all-categories] Failed", error);
  process.exitCode = 1;
});
