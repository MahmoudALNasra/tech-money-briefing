import { createClient } from "@supabase/supabase-js";
import {
  detectCorporateTakeaways,
  detectLowBurstiness,
  detectOwnerVoiceTemplateSignals
} from "../lib/article-attribution.ts";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const slugs = [
  "how-to-leverage-memes-for-viral-marketing-a-guide-for-startups",
  "harnessing-google-s-audience-loyalty-ecosystem-for-seo-success",
  "woocommerce-vs-shopify-seo-which-platform-gives-you-more-control",
  "saas-pricing-page-best-practices-how-to-structure-plans-that-convert",
  "ramp-s-750m-funding-round-implications-for-fintech-investors-and-operators",
  "rpm-vs-cpm-explained-what-publishers-and-creators-need-to-know",
  "navigating-the-future-of-ai-generated-music-implications-for-the-b2b-music-industry",
  "navigating-the-impacts-of-google-s-may-core-update-on-seo-monetization-strategies",
  "patina-s-2-million-funding-round-a-disruptive-force-in-the-stagnant-fragrance-industry",
  "navigating-regulatory-risks-insights-from-amazon-ceo-s-concerns-on-anthropic-ai-models"
];

const { data } = await supabase
  .from("articles")
  .select("slug,category,title,content,key_takeaways")
  .in("slug", slugs);

for (const article of data ?? []) {
  const issues = [
    ...detectOwnerVoiceTemplateSignals(article.content),
    ...detectCorporateTakeaways(article.key_takeaways),
    ...detectLowBurstiness(article.content)
  ];
  console.log(
    `${issues.length ? "FAIL" : "PASS"} | ${article.category} | ${article.slug}`
  );
  if (issues.length) {
    console.log(`  ${issues.join("; ")}`);
  }
}
