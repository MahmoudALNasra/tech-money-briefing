import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import { absoluteUrl } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export const LOCAL_BUSINESS_INSIGHTS_MIN_SAMPLE = 75;

export type LocalBusinessInsightStat = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type LocalBusinessInsightsSnapshot = {
  ready: boolean;
  sampleSize: number;
  minimumSample: number;
  generatedAt: string;
  stats: LocalBusinessInsightStat[];
  topCategories: Array<{ category: string; searches: number }>;
  methodology: string;
};

function pct(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 1000) / 10;
}

function hasEmailCandidate(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && normalized !== "none" && normalized !== "n/a";
}

function aggregateRows(rows: Array<{ enrichment: CachedEnrichmentPayload }>) {
  const total = rows.length;

  let withoutReachableWebsite = 0;
  let withoutEmailCandidate = 0;
  let withActiveSocial = 0;
  let withContactPage = 0;
  let competitorDensityTotal = 0;
  let competitorDensityCount = 0;

  for (const row of rows) {
    const enrichment = row.enrichment;

    if (!enrichment.website_reachable) {
      withoutReachableWebsite += 1;
    }

    if (!hasEmailCandidate(enrichment.email_candidates)) {
      withoutEmailCandidate += 1;
    }

    if (enrichment.active_social) {
      withActiveSocial += 1;
    }

    if (enrichment.has_contact_page) {
      withContactPage += 1;
    }

    if (Number.isFinite(enrichment.competitor_density_1mi)) {
      competitorDensityTotal += enrichment.competitor_density_1mi;
      competitorDensityCount += 1;
    }
  }

  const avgCompetitorDensity =
    competitorDensityCount > 0
      ? Math.round((competitorDensityTotal / competitorDensityCount) * 10) / 10
      : 0;

  return {
    total,
    withoutReachableWebsite,
    withoutEmailCandidate,
    withActiveSocial,
    withContactPage,
    avgCompetitorDensity
  };
}

async function getTopSearchCategories(limit = 6) {
  const { data, error } = await supabase
    .from("business_data_searches")
    .select("category")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const row of data) {
    const category = String(row.category ?? "").trim();
    if (!category) {
      continue;
    }

    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, searches]) => ({ category, searches }))
    .sort((a, b) => b.searches - a.searches)
    .slice(0, limit);
}

export async function getLocalBusinessInsightsSnapshot(): Promise<LocalBusinessInsightsSnapshot> {
  const minimumSample = LOCAL_BUSINESS_INSIGHTS_MIN_SAMPLE;
  const { data, error } = await supabase
    .from("enriched_business_cache")
    .select("enrichment")
    .order("enriched_at", { ascending: false })
    .limit(2000);

  const rows = (data ?? []).map((row) => ({
    enrichment: row.enrichment as CachedEnrichmentPayload
  }));

  const totals = aggregateRows(rows);
  const topCategories = await getTopSearchCategories();
  const ready = !error && totals.total >= minimumSample;

  const stats: LocalBusinessInsightStat[] = ready
    ? [
        {
          id: "no-website",
          label: "No reachable website",
          value: `${pct(totals.withoutReachableWebsite, totals.total)}%`,
          detail: `${totals.withoutReachableWebsite} of ${totals.total} analyzed businesses had no reachable website at enrichment time.`
        },
        {
          id: "no-email",
          label: "No email candidate found",
          value: `${pct(totals.withoutEmailCandidate, totals.total)}%`,
          detail: `${totals.withoutEmailCandidate} of ${totals.total} businesses had no public email candidate discovered during enrichment.`
        },
        {
          id: "active-social",
          label: "Active social presence",
          value: `${pct(totals.withActiveSocial, totals.total)}%`,
          detail: `${totals.withActiveSocial} of ${totals.total} businesses showed active social signals in the enrichment pass.`
        },
        {
          id: "contact-page",
          label: "Dedicated contact page",
          value: `${pct(totals.withContactPage, totals.total)}%`,
          detail: `${totals.withContactPage} of ${totals.total} businesses exposed a dedicated contact page on their site.`
        },
        {
          id: "competitor-density",
          label: "Avg. competitors within ~1 mile",
          value: `${totals.avgCompetitorDensity}`,
          detail: `Average nearby competitor count across ${totals.total} enriched businesses in the current cache window.`
        }
      ]
    : [];

  return {
    ready,
    sampleSize: totals.total,
    minimumSample,
    generatedAt: new Date().toISOString(),
    stats,
    topCategories,
    methodology:
      "Aggregated from anonymized enrichment cache entries produced by Tech Revenue Brief's local lead generator. Counts and percentages only — no individual business names, user searches, or paid report rows are published."
  };
}

export function buildCitationBlock(snapshot: LocalBusinessInsightsSnapshot, stat: LocalBusinessInsightStat) {
  return `${stat.label}: ${stat.value} across ${snapshot.sampleSize} analyzed local businesses (${new Date(snapshot.generatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}). Source: Tech Revenue Brief Local Business Insights (${absoluteUrl("/local-business-insights")}).`;
}
