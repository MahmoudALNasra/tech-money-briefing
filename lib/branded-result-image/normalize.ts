import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";

export function trimSummary(text: string, maxLength = 180) {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const shortened = normalized.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${(lastSpace > 80 ? shortened.slice(0, lastSpace) : shortened).trim()}…`;
}

export function inferBusinessDescriptor(enrichment: CachedEnrichmentPayload) {
  const pitch = enrichment.pitch_angle.toLowerCase();

  if (pitch.includes("restaurant") || pitch.includes("bakery") || pitch.includes("cafe")) {
    return "local food business";
  }

  if (pitch.includes("dental") || pitch.includes("clinic") || pitch.includes("medical")) {
    return "local healthcare practice";
  }

  if (pitch.includes("salon") || pitch.includes("spa") || pitch.includes("barber")) {
    return "local beauty business";
  }

  if (pitch.includes("contractor") || pitch.includes("plumb") || pitch.includes("hvac")) {
    return "local home-services business";
  }

  if (pitch.includes("gym") || pitch.includes("fitness")) {
    return "local fitness business";
  }

  return "local business";
}

function extractRatingHint(enrichment: CachedEnrichmentPayload) {
  const haystack = `${enrichment.opportunity_signal} ${enrichment.gbp_profile_signal}`;
  const match = haystack.match(/(\d(?:\.\d)?)\s*(?:★|stars?)/i);
  return match?.[1] ?? null;
}

function extractReviewHint(enrichment: CachedEnrichmentPayload) {
  const haystack = `${enrichment.opportunity_signal} ${enrichment.gbp_profile_signal}`;
  const match = haystack.match(/(\d{2,})\+?\s*reviews?/i);
  return match?.[1] ?? null;
}

export function buildGeneralizedHeadline(
  enrichment: CachedEnrichmentPayload,
  locationHint?: string
) {
  const descriptor = inferBusinessDescriptor(enrichment);
  const rating = extractRatingHint(enrichment);
  const reviews = extractReviewHint(enrichment);
  const location = locationHint?.trim();

  let headline = `A ${descriptor}`;

  if (rating) {
    headline = `A ${rating}★ ${descriptor}`;
  }

  if (reviews) {
    headline += ` with ${reviews}+ reviews`;
  } else if (!enrichment.website_reachable) {
    headline += " with no reachable website";
  }

  if (location) {
    headline += ` in ${location}`;
  }

  return headline;
}

export function brandedImageInputFromEnrichment(
  enrichment: CachedEnrichmentPayload,
  locationHint?: string
): BrandedResultImageInput {
  return {
    headline: buildGeneralizedHeadline(enrichment, locationHint),
    pitch_angle: enrichment.pitch_angle.trim(),
    opportunity_signal: enrichment.opportunity_signal.trim(),
    summary_line: trimSummary(enrichment.business_opportunity_summary),
    gbp_profile_signal: enrichment.gbp_profile_signal.trim() || undefined,
    competitor_density_1mi: enrichment.competitor_density_1mi,
    website_reachable: enrichment.website_reachable,
    active_social: enrichment.active_social
  };
}

export function brandedImageInputFromSocialPayload(payload: {
  headline?: string;
  business_descriptor?: string;
  pitch_angle?: string;
  opportunity_signal?: string;
  summary_line?: string;
  business_opportunity_summary?: string;
  gbp_profile_signal?: string;
  competitor_density_1mi?: number;
  website_reachable?: boolean;
  active_social?: boolean;
}): BrandedResultImageInput {
  const summary =
    payload.summary_line?.trim() ||
    trimSummary(String(payload.business_opportunity_summary ?? ""));

  const headline =
    payload.headline?.trim() ||
    `A ${String(payload.business_descriptor ?? "local business").replace(/^a\s+/i, "")}`;

  return {
    headline,
    pitch_angle: String(payload.pitch_angle ?? "").trim(),
    opportunity_signal: String(payload.opportunity_signal ?? "").trim(),
    summary_line: summary,
    gbp_profile_signal: payload.gbp_profile_signal?.trim() || undefined,
    competitor_density_1mi:
      typeof payload.competitor_density_1mi === "number"
        ? payload.competitor_density_1mi
        : undefined,
    website_reachable: payload.website_reachable,
    active_social: payload.active_social
  };
}
