import { createHash } from "node:crypto";

import type { GooglePlaceDetails } from "@/lib/business-data-export-core";
import { ENRICHMENT_CACHE_TTL_DAYS } from "@/lib/business-data-free-config";
import { supabase } from "@/lib/supabase";

export type CachedEnrichmentPayload = {
  email_candidates: string;
  website_reachable: boolean;
  website_title: string;
  meta_description: string;
  homepage_headings: string;
  social_links: string;
  contact_url: string;
  has_contact_page: boolean;
  opportunity_signal: string;
  website_analysis: string;
  business_opportunity_summary: string;
  recommended_pitch: string;
  pitch_angle: string;
  active_social: boolean;
  gbp_profile_signal: string;
  price_level: number | null;
  competitor_density_1mi: number;
};

export function buildPlaceDataHash(detail: GooglePlaceDetails) {
  const payload = [
    detail.rating ?? "",
    detail.user_ratings_total ?? "",
    detail.business_status ?? "",
    detail.website ?? "",
    detail.formatted_phone_number ?? ""
  ].join("|");

  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

function isCacheFresh(enrichedAt: string) {
  const enrichedMs = Date.parse(enrichedAt);
  if (!Number.isFinite(enrichedMs)) {
    return false;
  }

  const ttlMs = ENRICHMENT_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - enrichedMs < ttlMs;
}

export async function getCachedEnrichment(placeId: string) {
  const { data, error } = await supabase
    .from("enriched_business_cache")
    .select("place_id, source_place_data_hash, enrichment, enriched_at")
    .eq("place_id", placeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const enrichedAt = String(data.enriched_at ?? "");
  if (!isCacheFresh(enrichedAt)) {
    return null;
  }

  return {
    placeId: String(data.place_id),
    sourcePlaceDataHash: String(data.source_place_data_hash ?? ""),
    enrichment: data.enrichment as CachedEnrichmentPayload,
    enrichedAt
  };
}

export async function upsertCachedEnrichment(input: {
  placeId: string;
  sourcePlaceDataHash: string;
  enrichment: CachedEnrichmentPayload;
  searchCategory?: string | null;
  areaLabel?: string | null;
}) {
  const now = new Date().toISOString();

  const { error } = await supabase.from("enriched_business_cache").upsert(
    {
      place_id: input.placeId,
      source_place_data_hash: input.sourcePlaceDataHash,
      enrichment: input.enrichment,
      search_category: input.searchCategory ?? null,
      area_label: input.areaLabel ?? null,
      enriched_at: now,
      updated_at: now
    },
    { onConflict: "place_id" }
  );

  if (error) {
    console.error("[enriched-business-cache]", error.message);
  }
}

export function extractCachedEnrichmentFields(
  row: Record<string, string | number | boolean | null>
): CachedEnrichmentPayload {
  return {
    email_candidates: String(row.email_candidates ?? ""),
    website_reachable: Boolean(row.website_reachable),
    website_title: String(row.website_title ?? ""),
    meta_description: String(row.meta_description ?? ""),
    homepage_headings: String(row.homepage_headings ?? ""),
    social_links: String(row.social_links ?? ""),
    contact_url: String(row.contact_url ?? ""),
    has_contact_page: Boolean(row.has_contact_page),
    opportunity_signal: String(row.opportunity_signal ?? ""),
    website_analysis: String(row.website_analysis ?? ""),
    business_opportunity_summary: String(row.business_opportunity_summary ?? ""),
    recommended_pitch: String(row.recommended_pitch ?? ""),
    pitch_angle: String(row.pitch_angle ?? ""),
    active_social: Boolean(row.active_social),
    gbp_profile_signal: String(row.gbp_profile_signal ?? ""),
    price_level:
      row.price_level === null || row.price_level === undefined
        ? null
        : Number(row.price_level),
    competitor_density_1mi: Number(row.competitor_density_1mi ?? 0)
  };
}

export async function listDistinctPitchAngles(limit = 24) {
  const { data, error } = await supabase
    .from("enriched_business_cache")
    .select("enrichment")
    .order("enriched_at", { ascending: false })
    .limit(250);

  if (error) {
    return [];
  }

  const angles = new Set<string>();
  for (const row of data ?? []) {
    const enrichment = row.enrichment as { pitch_angle?: string } | null;
    const pitch = String(enrichment?.pitch_angle ?? "").trim();
    if (pitch) {
      angles.add(pitch);
    }
    if (angles.size >= limit) {
      break;
    }
  }

  return Array.from(angles);
}
