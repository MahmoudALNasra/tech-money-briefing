import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import { brandedImageInputFromEnrichment } from "@/lib/branded-result-image/normalize";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";
import { safeTrim } from "@/lib/safe-string";
import { supabase } from "@/lib/supabase";

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
    .filter(isUsableEnrichment)
    .map((enrichment) => ({ enrichment, score: scoreEnrichmentRow(enrichment) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (!ranked.length) {
    throw new Error("No usable enrichment examples in cache.");
  }

  const pick = ranked[Math.floor(Math.random() * ranked.length)].enrichment;
  const brandedImageInput = brandedImageInputFromEnrichment(pick);
  const pitchAngle = safeTrim(pick.pitch_angle, "local business");

  return {
    enrichment: pick,
    brandedImageInput,
    business_descriptor: pitchAngle.toLowerCase().startsWith("a ")
      ? pitchAngle
      : `a ${pitchAngle.toLowerCase()}`
  };
}
