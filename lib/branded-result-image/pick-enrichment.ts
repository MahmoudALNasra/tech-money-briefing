import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import { brandedImageInputFromEnrichment } from "@/lib/branded-result-image/normalize";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";
import { supabase } from "@/lib/supabase";

function scoreEnrichmentRow(enrichment: CachedEnrichmentPayload) {
  let score = 0;

  if (!enrichment.website_reachable) {
    score += 3;
  }

  if (enrichment.opportunity_signal.trim().length > 24) {
    score += 2;
  }

  if (enrichment.pitch_angle.trim().length > 12) {
    score += 2;
  }

  if (enrichment.competitor_density_1mi >= 8) {
    score += 1;
  }

  if (/established|review history|unclaimed|no website/i.test(enrichment.gbp_profile_signal)) {
    score += 2;
  }

  return score;
}

export type PickedEnrichmentExample = {
  enrichment: CachedEnrichmentPayload;
  brandedImageInput: BrandedResultImageInput;
  business_descriptor: string;
};

export async function pickEnrichmentExample(): Promise<PickedEnrichmentExample> {
  const { data, error } = await supabase
    .from("enriched_business_cache")
    .select("enrichment")
    .order("enriched_at", { ascending: false })
    .limit(120);

  if (error || !data?.length) {
    throw new Error("No enrichment cache rows available.");
  }

  const ranked = data
    .map((row) => row.enrichment as CachedEnrichmentPayload)
    .filter((enrichment) => enrichment.opportunity_signal.trim() && enrichment.pitch_angle.trim())
    .map((enrichment) => ({ enrichment, score: scoreEnrichmentRow(enrichment) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (!ranked.length) {
    throw new Error("No usable enrichment examples in cache.");
  }

  const pick = ranked[Math.floor(Math.random() * ranked.length)].enrichment;
  const brandedImageInput = brandedImageInputFromEnrichment(pick);

  return {
    enrichment: pick,
    brandedImageInput,
    business_descriptor: pick.pitch_angle.trim().toLowerCase().startsWith("a ")
      ? pick.pitch_angle.trim()
      : `a ${pick.pitch_angle.trim().toLowerCase()}`
  };
}
