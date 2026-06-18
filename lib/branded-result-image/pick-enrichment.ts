import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import { brandedImageInputFromEnrichment } from "@/lib/branded-result-image/normalize";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";
import {
  resolveEnrichmentPublicContext,
  type EnrichmentPublicContext
} from "@/lib/enrichment-public-context";
import { safeTrim } from "@/lib/safe-string";
import { supabase } from "@/lib/supabase";

type CacheRow = {
  place_id: string;
  search_category: string | null;
  area_label: string | null;
  enrichment: CachedEnrichmentPayload;
};

function scoreEnrichmentRow(enrichment: CachedEnrichmentPayload) {
  const opportunitySignal = safeTrim(enrichment.opportunity_signal);
  const pitchAngle = safeTrim(enrichment.pitch_angle);
  const gbpSignal = safeTrim(enrichment.gbp_profile_signal);
  let score = 0;

  if (!enrichment.website_reachable) {
    score += 3;
  }

  if (opportunitySignal.length > 24) {
    score += 2;
  }

  if (pitchAngle.length > 12) {
    score += 2;
  }

  if ((enrichment.competitor_density_1mi ?? 0) >= 8) {
    score += 1;
  }

  if (/established|review history|unclaimed|no website/i.test(gbpSignal)) {
    score += 2;
  }

  return score;
}

function isUsableEnrichment(enrichment: CachedEnrichmentPayload) {
  return Boolean(safeTrim(enrichment.opportunity_signal) && safeTrim(enrichment.pitch_angle));
}

export type PickedEnrichmentExample = {
  enrichment: CachedEnrichmentPayload;
  brandedImageInput: BrandedResultImageInput;
  business_descriptor: string;
  publicContext: EnrichmentPublicContext;
};

export async function pickEnrichmentExample(): Promise<PickedEnrichmentExample> {
  const { data, error } = await supabase
    .from("enriched_business_cache")
    .select("place_id, search_category, area_label, enrichment")
    .order("enriched_at", { ascending: false })
    .limit(120);

  if (error || !data?.length) {
    throw new Error("No enrichment cache rows available.");
  }

  const ranked = (data as CacheRow[])
    .filter((row) => isUsableEnrichment(row.enrichment))
    .map((row) => ({ row, score: scoreEnrichmentRow(row.enrichment) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (!ranked.length) {
    throw new Error("No usable enrichment examples in cache.");
  }

  const pickRow = ranked[Math.floor(Math.random() * ranked.length)].row;
  const pick = pickRow.enrichment;
  const publicContext = await resolveEnrichmentPublicContext({
    enrichment: pick,
    search_category: pickRow.search_category,
    area_label: pickRow.area_label,
    place_id: pickRow.place_id
  });
  const brandedImageInput = brandedImageInputFromEnrichment(pick, publicContext);
  const pitchAngle = safeTrim(pick.pitch_angle, publicContext.business_category_singular);

  return {
    enrichment: pick,
    brandedImageInput,
    publicContext,
    business_descriptor: pitchAngle.toLowerCase().startsWith("a ")
      ? pitchAngle
      : `a ${publicContext.business_category_singular}${publicContext.area_phrase}`
  };
}
