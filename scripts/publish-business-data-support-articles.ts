import { createUniqueShareId, createUniqueSlug, articleExistsBySourceUrl } from "../lib/article-publish";
import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type SupportArticle = {
  id: string;
  title: string;
  category: string;
  meta_description: string;
  key_takeaways: string[];
  content: string;
};

const articles: SupportArticle[] = [
  {
    id: "who-are-my-local-competitors",
    title: "Who Are My Local Competitors? How to Build a Useful Competitor List",
    category: "digital-marketing",
    meta_description:
      "Learn how to find local competitors by category, radius, website signals, reviews, and market overlap using practical business data.",
    key_takeaways: [
      "Local competitors are the businesses customers compare before choosing you, not only the companies that sell the exact same thing.",
      "A useful competitor list includes category, location, website, reviews, contact data, and marketing signals.",
      "The Business Data Generator can turn a city, address, or map area into a cleaner local competitor research list."
    ],
    content: `If you are asking "who are my local competitors?", start with the businesses customers can realistically choose instead of you. That usually means companies in the same category, nearby neighborhoods, adjacent services, and businesses that rank or appear where your customers search.

The fastest way to begin is to use the [Business Data Generator](/business-data-generator) to search a city, address, or business area, choose a category, and export a local competitor list you can actually review.

## Quick Answer

Your local competitors are the nearby businesses competing for the same customers, search demand, foot traffic, calls, appointments, bookings, or quote requests. They may include direct competitors, substitute services, franchises, marketplaces, and niche businesses with stronger websites or better reviews.

## What To Include In A Competitor List

- Business name
- Category or service type
- Address and service area
- Phone number
- Website URL
- Google Maps URL
- Rating and review count
- Public email candidates
- Website tracking and SEO signals
- Notes about offer, positioning, and follow-up priority

## Why Local Competitor Research Starts With A Map

Search results are not the same in every city, neighborhood, or radius. A dentist in one zip code, a roofing company in another county, or a restaurant beside a tourist area may face a completely different competitor set.

That is why local competitor analysis should begin with geography. Use a city, address, landmark, or dropped pin, then compare nearby businesses by category and distance.

## How To Use The Business Data Generator

1. Open the [local business data and competitor research tool](/business-data-generator).
2. Search a city, address, business name, or neighborhood.
3. Choose a business category such as restaurants, dentists, roofers, salons, agencies, or contractors.
4. Preview nearby businesses.
5. Generate an Excel report when you need more competitors, website signals, and public contact data.

## FAQ

### Is every nearby business a competitor?

No. A competitor must overlap with the same buyer, job, location, or search intent. Nearby businesses are candidates; your review process decides which ones matter.

### Can I use this for agency prospecting?

Yes. Agencies can use local competitor research to find businesses with weak websites, missing tracking, thin SEO, or clear outreach opportunities.

### What is the best first search?

Start with your main category and a tight radius around the market you care about. Then expand the radius or test adjacent categories.`
  },
  {
    id: "local-competitor-analysis-checklist",
    title: "Local Competitor Analysis Checklist for Small Businesses",
    category: "seo",
    meta_description:
      "Use this local competitor analysis checklist to compare nearby businesses, websites, reviews, SEO signals, and outreach opportunities.",
    key_takeaways: [
      "Local competitor analysis works best when it compares location, visibility, reviews, website quality, and offer clarity.",
      "A checklist prevents you from collecting business data without turning it into decisions.",
      "Exporting structured competitor data makes it easier to prioritize marketing and sales opportunities."
    ],
    content: `Local competitor analysis helps you understand who appears in your market, why customers might choose them, and where your business or client can win. It is useful for SEO, Google Business Profile work, paid ads, sales targeting, and market expansion.

Use the [Business Data Generator](/business-data-generator) to build the competitor list first, then work through this checklist.

## Local Competitor Analysis Checklist

[ ] Search the target city, neighborhood, address, or service area.
[ ] Choose the closest business category for the market.
[ ] Export the local competitor list.
[ ] Compare ratings and review counts.
[ ] Check which competitors have websites.
[ ] Review homepage messaging and offers.
[ ] Look for missing analytics, schema, or tracking signals.
[ ] Identify weak mobile or speed experiences.
[ ] Prioritize competitors with visible gaps and strong commercial intent.
[ ] Turn the findings into SEO, content, ads, or outreach actions.

## What To Compare

Competitor analysis is not just a list of names. Compare how each business earns attention and trust. Review the website, map listing, category, contact options, reviews, and visible marketing systems.

## How Agencies Can Use This

Agencies can turn local competitor analysis into sales intelligence. If a business has strong reviews but a weak website, missing tracking, or no clear offer, that can become a practical pitch. If competitors are investing in better websites and SEO, that can support a stronger strategy conversation.

## FAQ

### How many competitors should I analyze?

Start with 10 to 30. For dense markets, expand to 50 or more after you know the category and radius are correct.

### Should I only analyze direct competitors?

No. Include substitute businesses and adjacent services when customers might compare them before buying.

### What tool should I use to start?

Use the [local competitor research and business data generator](/business-data-generator) to collect the first list, then enrich and prioritize manually.`
  },
  {
    id: "build-local-lead-list-from-competitor-research",
    title: "How to Build a Local Lead List From Competitor Research",
    category: "startups",
    meta_description:
      "Turn competitor research into a local lead list for sales, agencies, partnerships, local SEO, and market validation.",
    key_takeaways: [
      "Competitor research can become a lead list when you focus on businesses with a clear reason to contact.",
      "The best local lead lists combine business data, website signals, and a specific outreach angle.",
      "A cleaner export saves time and reduces low-quality prospecting."
    ],
    content: `A local lead list is stronger when it comes from competitor research instead of a random scrape. You are not just collecting businesses; you are looking for companies in a market where there is a reason to reach out.

The [Business Data Generator](/business-data-generator) helps you search a location, choose a category, and export businesses with website and opportunity signals.

## Quick Answer

To build a local lead list from competitor research, choose a market, search the right business category, export structured business data, filter for fit, then write outreach around a specific opportunity such as website improvement, local SEO, analytics setup, or offer clarity.

## A Simple Workflow

1. Pick one market, city, neighborhood, or service area.
2. Choose one category such as dentists, restaurants, roofers, salons, clinics, agencies, or contractors.
3. Generate a local business export.
4. Sort by website, reviews, rating, and opportunity signal.
5. Remove businesses that are not a fit.
6. Group the remaining leads by outreach angle.
7. Follow up with a specific reason, not a generic pitch.

## Good Lead List Filters

- Has a website but weak positioning
- Has many reviews but poor conversion copy
- Has no obvious tracking or schema
- Has a phone number and active location
- Serves a category where website quality affects trust
- Competes in a dense local market

## Why This Supports Better Outreach

Cold outreach works better when the reason is obvious. A local competitor list can show that a business is visible, active, and in a competitive market. Website analysis can then give you the reason to contact them.

## FAQ

### Is this only for sales teams?

No. Founders, agencies, consultants, and local business owners can use the same workflow for market research and positioning.

### Can I export the list?

Yes. The [business data export tool](/business-data-generator) creates formatted Excel reports for completed searches.

### Should I contact every business in the export?

No. Use the export to filter. The best lead list is smaller, cleaner, and tied to a specific offer.`
  }
];

async function publishSupportArticles() {
  const supabase = getSupabaseClient();

  for (const article of articles) {
    const sourceUrl = `business-data-support://${article.id}`;
    const exists = await articleExistsBySourceUrl(sourceUrl);

    if (exists) {
      console.log(`[skip] ${article.title}`);
      continue;
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
      source_name: "Tech Revenue Brief",
      source_url: sourceUrl,
      image_url: null,
      share_id: shareId,
      status: "published",
      published_at: now,
      created_at: now,
      updated_at: now
    });

    if (error) {
      throw new Error(`Failed to publish ${article.title}: ${error.message}`);
    }

    console.log(`[published] /${article.category}/${slug}`);
  }
}

publishSupportArticles().catch((error) => {
  console.error(error);
  process.exit(1);
});
