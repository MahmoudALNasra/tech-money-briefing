/**
 * Publish curated owner-voice articles into core categories.
 * Usage: npm run articles:publish-owner-voice-core
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
    slug: "matomo-vs-google-analytics-when-i-leave-ga4-for-self-hosted-analytics",
    category: "digital-marketing",
    title: "Matomo vs Google Analytics: When I Leave GA4 for Self-Hosted Analytics",
    meta_description:
      "Matomo vs GA4 for operators who care about privacy, data ownership, and whether self-hosted analytics is worth the ops cost.",
    key_takeaways: [
      "Keep GA4 when ads attribution and Search Console linking still drive weekly decisions.",
      "Move to Matomo when privacy policy, EU data residency, or owning raw logs matters more than Google integrations.",
      "Budget for hosting and upgrades before you call Matomo free."
    ],
    source_url: "editorial://owner-voice/matomo-vs-ga4-2026-07",
    imageSourceUrl: "https://matomo.org/",
    content: `I do not switch analytics stacks because Twitter decided GA4 is evil. I switch when the data ownership story starts blocking shipping.

## Quick Answer

Keep [Google Analytics 4](https://analytics.google.com/) if you need ads audiences, Search Console linking, or ecommerce events that your media buyer already knows. Choose [Matomo](https://matomo.org/) when you want self-hosted or EU-hosted analytics you control, and you can afford the server and upgrade work. Many teams run Matomo for product traffic and keep GA4 only for paid campaigns.

## What GA4 still wins

GA4 is messy, but it is still the path of least resistance for:

- Google Ads attribution
- Remarketing audiences
- Search Console connections
- Agency reports that assume GA4 exports

If those are on the critical path, deleting GA4 usually creates a quieter quarter and a louder quarter after that.

## What Matomo wins

Matomo wins on ownership. You decide retention. You decide who can export. You can put the stack next to the rest of your EU infrastructure. For publishers with strict privacy language, that is not a vibe. It is a contract clause.

The cost is ops. Self-hosted Matomo is not free labor. Someone patches it. Someone watches disk. Someone owns plugin updates.

## My decision test

I ask three questions:

1. Which reports changed a decision last month?
2. Do we need Google ads audiences this quarter?
3. Who will own Matomo at 2am when PHP upgrades break tracking?

If the answer to 2 is yes and 3 is nobody, stay on GA4. If 1 is mostly traffic trends and privacy counsel is loud, Matomo is worth a pilot.

## Practical rollout

I never rip and replace on day one. I install Matomo beside GA4 for 30 days, compare top pages and channels, then demote the tool nobody opens. See also our [Matomo vs Google Analytics](/compare/matomo-vs-google-analytics) compare page before you migrate tags.`
  },
  {
    slug: "stripe-vs-paddle-how-i-choose-saas-billing-without-surprises",
    category: "fintech",
    title: "Stripe vs Paddle: How I Choose SaaS Billing Without Surprises",
    meta_description:
      "Stripe vs Paddle for SaaS founders: tax handling, chargebacks, pricing control, and the checklist I use before switching billing.",
    key_takeaways: [
      "Stripe wins when you want pricing control and already have finance ops for tax and invoicing.",
      "Paddle wins when merchant-of-record tax handling removes more pain than fee percentage adds.",
      "Model net revenue after fees, refunds, and failed payments — not sticker processing rates."
    ],
    source_url: "editorial://owner-voice/stripe-vs-paddle-2026-07",
    imageSourceUrl: "https://paddle.com/",
    content: `Billing vendors love feature grids. Founders care about whether money clears and whether tax season becomes a second product.

## Quick Answer

Choose [Stripe](https://stripe.com/) if you want deep payment control, custom checkout, and you already have someone who can own tax and invoicing. Choose [Paddle](https://www.paddle.com/) if you want a merchant of record to take VAT/sales tax complexity off your plate and you can live with less checkout customization. Decide from net revenue after fees, not from Twitter screenshots.

## When Stripe is the practical pick

Stripe is still my default for product-led SaaS with weird pricing, usage components, or heavy experimentation. The API surface is huge. That is both the gift and the trap.

You still need:

- Tax configuration ownership
- Dunning and failed payment workflows
- A human who reads dispute emails

If those roles do not exist, Stripe does not magically invent them.

## When Paddle is the practical pick

Paddle earns its fee when international tax compliance is the thing slowing launches. Merchant-of-record framing helps small teams sell globally without building a mini finance department first.

You trade control. Pricing experiments, custom invoicing, and edge-case checkout flows can feel tighter. Price that trade honestly.

## The spreadsheet I actually run

Before switching, I estimate for 90 days:

- Gross volume
- Processor / MoR fees
- Refund rate
- Failed payment recovery
- Hours of founder time on tax tickets

Winner = higher net and fewer nights spent in Stripe dashboards arguing with yourself.

## Next step

Compare the operator view on [Stripe vs Paddle](/compare/stripe-vs-paddle). If you already published a long-form Stripe vs Paddle brief, treat this as the decision checklist you hand to finance before migration week.`
  },
  {
    slug: "how-i-use-keyword-clusters-before-writing-another-seo-brief",
    category: "seo",
    title: "How I Use Keyword Clusters Before Writing Another SEO Brief",
    meta_description:
      "A practical keyword clustering workflow for publishers: map intent, avoid cannibalization, and brief writers before you publish more thin posts.",
    key_takeaways: [
      "Cluster by search intent and SERP overlap, not by synonym lists alone.",
      "One cluster gets one primary URL; supporting pages earn internal links, not competing titles.",
      "If two drafts target the same SERP, merge them before you publish either."
    ],
    source_url: "editorial://owner-voice/keyword-clusters-2026-07",
    imageSourceUrl: "https://developers.google.com/search",
    content: `Keyword lists are not a content strategy. They are a shopping list. Clustering is how I stop writers from publishing five posts that fight each other on page two.

## Quick Answer

Build keyword clusters around shared intent and overlapping SERPs, assign one primary URL per cluster, then brief the article from that map. Use a [keyword cluster tool](/keyword-cluster-tool) to spot groups, then validate in [Google Search Console](https://search.google.com/search-console) before you expand. If two drafts chase the same SERP, merge them.

## My clustering workflow

1. Pull seed queries from GSC and competitor SERPs
2. Group by intent: problem, comparison, how-to, tool
3. Check whether Google already ranks the same URLs for those queries
4. Pick one money page per cluster
5. Write the brief only after the URL is chosen

Skipping step 4 is how you get three "best SEO tools" posts and zero rankings.

## Cannibalization signs I watch

- Two site URLs swapping positions for the same query
- Similar H1s published weeks apart
- Internal links pointing at the weaker page

When I see that, I consolidate. Redirects are cheaper than another rewrite sprint.

## What goes in the brief

A usable brief has:

- Primary query and 3–5 cluster supports
- Search intent in one sentence
- Required sections
- Internal links to earn and give
- Proof the page is not duplicating an existing URL

If the brief cannot name the existing page it must not compete with, it is not ready.

## Tools and next steps

Start with our [keyword cluster tool](/keyword-cluster-tool), then compare suites on [Semrush vs Ahrefs](/compare/semrush-vs-ahrefs) only after the cluster map exists. Tools do not fix a messy information architecture. They just make the mess look colorful.`
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
    status: "published",
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
      console.warn(`[owner-voice-core] inline images skipped for ${article.slug}`, error);
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

  console.log(JSON.stringify({ ok: true, dryRun, published: published.length, articles: published }, null, 2));
}

main().catch((error) => {
  console.error("[owner-voice-core] Failed", error);
  process.exitCode = 1;
});
