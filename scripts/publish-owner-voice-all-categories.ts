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
    slug: "chatgpt-projects-vs-claude-projects-what-i-use-when-briefs-pile-up",
    category: "ai-tools",
    title: "ChatGPT Projects vs Claude Projects: What I Use When Briefs Pile Up",
    meta_description:
      "A practical split between ChatGPT Projects and Claude Projects for operators: drafts, long docs, and when a fresh chat is still better.",
    key_takeaways: [
      "Use one Project per client or product — not one mega Project for everything.",
      "Claude wins on long messy docs; ChatGPT wins on quick drafts and sheet talk.",
      "If the Project is full of stale PDFs, archive it and start clean."
    ],
    source_url: "editorial://owner-voice/chatgpt-vs-claude-projects-2026-08",
    imageSourceUrl: "https://www.anthropic.com/",
    content: `I used to dump every PDF into one chat thread. By week three the model was arguing with a brief I'd already killed. Projects fixed some of that. Not all of it.

## Quick Answer

Open a Project per live engagement. Put only the current brief, brand voice, and last approved draft inside. Use [Claude](https://claude.ai/) when the packet is long. Use [ChatGPT](https://chatgpt.com/) when you need a fast first pass. Delete the Project when the job ships.

## What I put in a Project

- One brief
- One style note (short)
- The last client-approved version

I don't upload the entire Drive folder. The model gets confused. So do I.

## When I still open a blank chat

Pricing objections. Angry support replies. Anything where old context makes the tone softer than it should be.

Compare deeper stacks on [ChatGPT vs Claude vs Gemini](/ai-tools/chatgpt-vs-claude-vs-gemini-for-writing-a-practical-comparison) if you're still shopping. For daily work, two Projects beat twelve tabs.

## The cleanup rule

Friday: archive finished Projects. If I can't name the live job in five seconds, the Project is junk.

Keep the folder thin. The model isn't your filing cabinet.`
  },
  {
    slug: "i-killed-three-ad-audiences-after-one-honest-ga4-look",
    category: "digital-marketing",
    title: "I Killed Three Ad Audiences After One Honest GA4 Look",
    meta_description:
      "How I prune paid audiences using GA4 engaged sessions and conversion paths — not vanity CTR — after wasting budget on lookalikes.",
    key_takeaways: [
      "Judge audiences on engaged sessions and purchases, not CTR alone.",
      "Kill lookalikes that never show up in conversion paths.",
      "Rebuild from buyers and high-intent site events first."
    ],
    source_url: "editorial://owner-voice/kill-ad-audiences-ga4-2026-08",
    imageSourceUrl: "https://blog.google/products/ads-commerce/",
    content: `CTR looked fine. Spend looked fine. Pipeline looked like a polite shrug. So I opened [GA4](https://analytics.google.com/) without the ad-platform glasses on.

## Quick Answer

Export your last 28 days of converting users. See which audiences actually appear in paths. Pause anything that burns budget and never shows up. Rebuild from purchasers and form-submit events before you invent another lookalike.

## What the report said

Three audiences drove clicks. Zero showed in purchase paths. They were expensive tourists.

I kept the audience built from trial starts. I killed the "interest" stack that felt smart in the ad UI.

## The boring rebuild

1. Purchasers (180 days)
2. People who hit pricing twice
3. Newsletter subscribers who clicked a product link

That's it. UTMs stay clean — see the [UTM builder](/utm-builder) if your tags are still freestyle.

## What I tell clients

If Meta or Google loves an audience and GA4 never mentions it, believe GA4 until proven wrong.

Cut the tourists. Feed the buyers.`
  },
  {
    slug: "search-console-queries-i-rewrote-titles-for-before-touching-content",
    category: "seo",
    title: "Search Console Queries I Rewrote Titles For Before Touching Content",
    meta_description:
      "A Search Console title-rewrite workflow: match money queries, fix mismatched titles, and only then edit the body.",
    key_takeaways: [
      "Titles that ignore the query you already rank for waste impressions.",
      "Rewrite the title first; edit the body only if the promise still mismatches.",
      "One primary query per URL — stop stuffing three intents into one H1."
    ],
    source_url: "editorial://owner-voice/gsc-title-rewrites-2026-08",
    imageSourceUrl: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    content: `I used to rewrite whole posts when rankings stalled. Half the time the body was fine. The title was lying.

## Quick Answer

In [Search Console](https://search.google.com/search-console), sort a page by queries. Pick the query with impressions that matches what you can honestly deliver. Rewrite the title and H1 to that query. Wait. Only then touch the body if CTR stays dead.

## The mismatch I kept seeing

Query: "utm parameters examples"  
Title: "Ultimate Guide to Marketing Attribution"

People bounced. Of course they did.

## My rewrite checklist

- Put the query language near the front
- Drop "ultimate," "complete," and year spam unless the year matters
- Keep it under ~60 characters when I can without sounding clipped

Internal links help after the title tells the truth — not before.

## When content actually needs work

If the new title is honest and the page still answers a different question, then edit. Tools like [Ahrefs](https://ahrefs.com/) can wait until the on-page promise matches the click.

Honest titles are free. Misleading titles tax every impression.`
  },
  {
    slug: "shopify-collections-i-split-after-filters-stopped-helping",
    category: "ecommerce",
    title: "Shopify Collections I Split After Filters Stopped Helping",
    meta_description:
      "When to split Shopify collections instead of adding more filters — based on search queries, support tickets, and bounce on category pages.",
    key_takeaways: [
      "If shoppers search the same phrase, give it a collection — not another filter.",
      "Split by use-case before you split by color.",
      "Orphan products in 'All' are a tax on mobile."
    ],
    source_url: "editorial://owner-voice/shopify-collections-split-2026-08",
    imageSourceUrl: "https://www.shopify.com/",
    content: `I kept adding filters on a [Shopify](https://www.shopify.com/) collection until mobile looked like a cockpit. Support still asked "where's the travel size?"

## Quick Answer

When the same phrase shows up in site search and tickets, make a collection for it. Keep filters for true variants (size, color). Don't hide a demand spike behind three taps.

## What I split

- "Gifts under $50" — people typed it weekly
- "Refills" — repeat buyers hunted it
- "Starter kits" — new buyers bounced on the mega-collection

I left color and size as filters. Those aren't destinations.

## The test

Open the collection on your phone on LTE. If you need a tutorial to find the obvious thing, split it.

Platform debates like [Shopify vs WooCommerce](/compare/shopify-vs-woocommerce) can wait. Information architecture pays rent first.

## What I refuse

I refuse a single "All products" as the main nav item for catalogs over ~40 SKUs. That's a warehouse, not a storefront.

Give the search query a door.`
  },
  {
    slug: "onboarding-emails-i-cut-after-activation-barely-moved",
    category: "startups",
    title: "Onboarding Emails I Cut After Activation Barely Moved",
    meta_description:
      "Trim a SaaS onboarding email sequence when activation is flat: keep the one email that drives the first value action.",
    key_takeaways: [
      "Five polite emails aren't a product tour.",
      "Keep the message that drives the first aha action; cut the rest for two weeks.",
      "If activation is flat, fix the empty state before writing email #6."
    ],
    source_url: "editorial://owner-voice/cut-onboarding-emails-2026-08",
    imageSourceUrl: "https://stripe.com/",
    content: `We had a seven-email onboarding drip. Activation moved like a parked car. The sequence was a novel about features nobody had tried.

## Quick Answer

Pause every onboarding email except the one that pushes the first value action (import data, connect account, create first project). Measure two weeks. If activation still flat, fix the in-app empty state — don't write email eight.

## What I kept

One email: "Do this one thing in the next 10 minutes" with a deep link. No feature parade.

## What I cut

- "Welcome to the community"
- "Here's everything we can do"
- "Case study you didn't ask for" on day two

Billing can stay on [Stripe](https://stripe.com/). Onboarding can't stay on wishful copy.

## The awkward truth

If people need five emails to understand the product, the first screen failed.

Ship the aha in the product. Email is a nudge, not a second UI.`
  },
  {
    slug: "invoice-reminders-that-got-paid-without-sounding-hostile",
    category: "fintech",
    title: "Invoice Reminders That Got Paid Without Sounding Hostile",
    meta_description:
      "A practical invoice reminder cadence for freelancers and small SaaS: timing, tone, and what to attach so payments land.",
    key_takeaways: [
      "Remind before due, on due, then once with consequences — not daily guilt.",
      "Attach the invoice PDF and payment link every time.",
      "CC finance only after the second miss — not as a first move."
    ],
    source_url: "editorial://owner-voice/invoice-reminders-2026-08",
    imageSourceUrl: "https://www.paddle.com/",
    content: `I used to write essay-length reminder emails. People paid slower. Short + clear + link worked better than moral lectures.

## Quick Answer

Day −3: friendly heads-up with PDF + pay link. Day 0: due today, same attachments. Day +5: firm note with late policy you already stated on the invoice. Stop. Call if it's still open.

## Templates I actually send

**Before due:** "Invoice {{number}} is due {{date}}. Link + PDF attached — yell if the PO changed."

**Due day:** "Due today. Same link. Reply if you need it resent to AP."

**Late:** "Still open. Late fee starts {{date}} per our terms. Happy to jump on a five-minute call."

Tools matter less than cadence — [Stripe](https://stripe.com/) invoicing or [Paddle](https://www.paddle.com/) for MoR shops. See [Stripe vs Paddle](/compare/stripe-vs-paddle) when you're choosing rails.

## What I stopped doing

I stopped apologizing for asking to be paid. I stopped CC'ing the CEO on email one.

Clear beats clever. Attach the PDF every time.`
  },
  {
    slug: "creator-rate-card-i-use-after-undercharging-two-brand-deals",
    category: "creator-business",
    title: "Creator Rate Card I Use After Undercharging Two Brand Deals",
    meta_description:
      "A simple creator rate card: deliverables, usage, rush fees, and when to say no — written after two underpriced brand deals.",
    key_takeaways: [
      "Price the deliverable and the usage window separately.",
      "Rush fees are real — put them on the card before the ask.",
      "If they want 'exposure' instead of a number, decline fast."
    ],
    source_url: "editorial://owner-voice/creator-rate-card-2026-08",
    imageSourceUrl: "https://www.beehiiv.com/",
    content: `I took two brand deals at "friends and family" rates. Both wanted revisions into next month. I built a rate card so I'd stop negotiating from guilt.

## Quick Answer

Publish a one-pager: deliverable prices, usage length, rush fee, revision limit. Send the card before you hop on a call. Platforms like [Beehiiv](https://www.beehiiv.com/) help you prove audience — the card protects your time.

## What's on my card

- Dedicated newsletter send
- Inline mention
- Short-form video (length + platforms)
- Usage: 30 / 90 / perpetual
- Rush: under 5 business days

Two revisions included. Extra rounds are billed.

## The line that saved me

"Happy to scope a custom package — here's the starting menu."

No apology. No 900-word pitch.

Compare distribution tools later ([Beehiiv vs Substack](/compare/beehiiv-vs-substack)). Undercharging isn't a growth strategy.

## After the card

I still discount strategically. I just discount from a number, not from zero.

Write the card once. Stop improvising your worth on Zoom.`
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
