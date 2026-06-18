import { pickEnrichmentExample } from "@/lib/branded-result-image/pick-enrichment";
import { FREE_LIFETIME_RUNS, FREE_RUN_ENRICHED_COUNT, SAMPLE_ENRICH_SIZE_PUBLIC } from "@/lib/business-data-free-config";
import { getLocalBusinessInsightsSnapshot } from "@/lib/local-business-insights";
import { getPublishedArticles } from "@/lib/articles";
import type { SocialDraftSource, SocialSourceType } from "@/lib/social-drafts/types";
import { SOCIAL_SOURCE_TYPES } from "@/lib/social-drafts/types";
import { articleUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { safeTrim } from "@/lib/safe-string";
import { supabase } from "@/lib/supabase";

const PRODUCT_TOPICS = [
  {
    topic: "Three free lifetime runs",
    detail: `Each account gets ${FREE_LIFETIME_RUNS} free lifetime search runs on /leads, with ${FREE_RUN_ENRICHED_COUNT} businesses fully enriched per run before you decide whether to buy export credits.`
  },
  {
    topic: "Sample enrich, then filter",
    detail: `The tool pulls about ${SAMPLE_ENRICH_SIZE_PUBLIC} nearby businesses first, enriches them, then lets you filter by pitch angle, website status, and opportunity signals before exporting.`
  },
  {
    topic: "Export-ready outreach columns",
    detail:
      "Paid exports include pitch angles, opportunity signals, email candidates, website checks, and recommended outreach copy — not just a raw Google scrape."
  },
  {
    topic: "Enrichment cache reuse",
    detail:
      "Repeat searches can reuse recent enrichment cache entries, which keeps previews fast and avoids re-scraping the same public business signals unnecessarily."
  }
] as const;

const ARTICLE_KEYWORDS =
  /\b(local seo|small business|sales|prospecting|outreach|marketing|google business|lead gen|agency|founder)\b/i;

async function collectEnrichmentExample(): Promise<SocialDraftSource> {
  const picked = await pickEnrichmentExample();

  return {
    type: "enrichment_example",
    payload: {
      hook_question: picked.brandedImageInput.hook_question,
      punch_line: picked.brandedImageInput.punch_line,
      badge_label: picked.brandedImageInput.badge_label,
      business_descriptor: picked.business_descriptor,
      gbp_profile_signal: safeTrim(picked.enrichment.gbp_profile_signal),
      opportunity_signal: safeTrim(picked.enrichment.opportunity_signal),
      pitch_angle: safeTrim(picked.enrichment.pitch_angle),
      website_reachable: picked.enrichment.website_reachable,
      competitor_density_1mi: picked.enrichment.competitor_density_1mi,
      active_social: picked.enrichment.active_social,
      privacy_note:
        "Do not use a real business name. Refer only as a generalized local business type."
    }
  };
}

async function collectAggregateStat(): Promise<SocialDraftSource> {
  const snapshot = await getLocalBusinessInsightsSnapshot();
  const stat =
    snapshot.stats[Math.floor(Math.random() * Math.max(snapshot.stats.length, 1))] ??
    snapshot.stats[0];

  if (!stat) {
    const { count } = await supabase
      .from("enriched_business_cache")
      .select("place_id", { count: "exact", head: true });

    const sampleSize = count ?? 0;

    if (sampleSize < 1) {
      throw new Error("No enrichment cache rows for aggregate stat source.");
    }

    return {
      type: "aggregate_stat",
      payload: {
        stat_label: "Businesses analyzed so far",
        stat_value: `${sampleSize}`,
        stat_detail:
          sampleSize < 10
            ? `Early anonymized sample of ${sampleSize} businesses in the enrichment cache. Phrase this conservatively — full percentage breakdowns come later.`
            : "Total anonymized businesses in the enrichment cache. Full percentage breakdowns publish once the sample is larger.",
        sample_size: sampleSize,
        insights_url: absoluteUrl("/local-business-insights"),
        sample_note: "Early sample — use careful wording, not sweeping claims."
      }
    };
  }

  return {
    type: "aggregate_stat",
    payload: {
      stat_label: stat.label,
      stat_value: stat.value,
      stat_detail: stat.detail,
      sample_size: snapshot.sampleSize,
      insights_url: absoluteUrl("/local-business-insights"),
      sample_note: snapshot.ready ? undefined : "Early sample — phrase conservatively."
    }
  };
}

function collectProductDetail(): SocialDraftSource {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const topic = PRODUCT_TOPICS[dayIndex % PRODUCT_TOPICS.length];

  return {
    type: "product_detail",
    payload: {
      topic: topic.topic,
      detail: topic.detail,
      leads_url: absoluteUrl("/leads")
    }
  };
}

async function collectArticleLink(): Promise<SocialDraftSource> {
  const articles = await getPublishedArticles(80);
  const matches = articles.filter(
    (article) =>
      ARTICLE_KEYWORDS.test(article.title) ||
      ARTICLE_KEYWORDS.test(article.meta_description) ||
      article.category === "seo" ||
      article.category === "startups" ||
      article.category === "ecommerce"
  );

  const pool = matches.length > 0 ? matches : articles.slice(0, 20);

  if (!pool.length) {
    throw new Error("No published articles available for social draft seed.");
  }

  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const article = pool[dayIndex % pool.length];

  return {
    type: "article_link",
    payload: {
      title: article.title,
      url: articleUrl(article),
      meta_description: article.meta_description,
      connection_to_leads:
        "Connect the article's lesson to finding or pitching local businesses with /leads — one specific bridge, not a generic plug."
    }
  };
}

export async function collectSocialDraftSource(
  sourceType: SocialSourceType
): Promise<SocialDraftSource> {
  switch (sourceType) {
    case "enrichment_example":
      return collectEnrichmentExample();
    case "aggregate_stat":
      return collectAggregateStat();
    case "product_detail":
      return collectProductDetail();
    case "article_link":
      return collectArticleLink();
    default:
      return collectProductDetail();
  }
}

export type ResolvedSocialDraftSource = {
  source: SocialDraftSource;
  requested_type: SocialSourceType;
  fallback_from?: SocialSourceType;
};

export async function resolveSocialDraftSource(
  preferredType: SocialSourceType
): Promise<ResolvedSocialDraftSource> {
  const startIndex = SOCIAL_SOURCE_TYPES.indexOf(preferredType);
  const tryOrder =
    startIndex === -1
      ? [...SOCIAL_SOURCE_TYPES]
      : [
          ...SOCIAL_SOURCE_TYPES.slice(startIndex),
          ...SOCIAL_SOURCE_TYPES.slice(0, startIndex)
        ];

  let lastError: Error | null = null;

  for (const type of tryOrder) {
    try {
      const source = await collectSocialDraftSource(type);
      return {
        source,
        requested_type: preferredType,
        ...(type !== preferredType ? { fallback_from: preferredType } : {})
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("No social draft source available.");
}
