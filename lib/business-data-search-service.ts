import {
  processPlacesBatch,
  type ExportRow,
  type GoogleNearbyPlace
} from "@/lib/business-data-export-core";
import {
  evaluateFreeRunAccess,
  getFreeRunStatus,
  recordFreeRunUsage
} from "@/lib/business-data-free-runs";
import {
  FREE_LIFETIME_RUNS,
  FREE_RADIUS_LIMIT_METERS,
  FREE_RUN_ENRICHED_COUNT
} from "@/lib/business-data-free-config";
import {
  applySearchFilters,
  parseSearchFilters,
  type PlaceWithDetails
} from "@/lib/business-data-search-filters";

export type SearchBusinessResult = {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  mapsUrl: string;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  businessStatus: string;
  lat: number | null;
  lng: number | null;
};

export type EnrichedPreviewRow = {
  place_id: string;
  name: string;
  website_analysis: string;
  business_opportunity_summary: string;
  recommended_pitch: string;
  pitch_angle: string;
  email_candidates?: string;
  opportunity_signal?: string;
  website_reachable?: boolean;
  website_title?: string;
  meta_description?: string;
  homepage_headings?: string;
  social_links?: string;
  contact_url?: string;
  has_contact_page?: boolean;
  active_social?: boolean;
  gbp_profile_signal?: string;
  competitor_density_1mi?: number;
  price_level?: number | null;
};

export function mapExportRowToPreview(row: ExportRow): EnrichedPreviewRow {
  return {
    place_id: row.place_id,
    name: row.name,
    website_analysis: row.website_analysis,
    business_opportunity_summary: row.business_opportunity_summary,
    recommended_pitch: row.recommended_pitch,
    pitch_angle: row.pitch_angle,
    email_candidates: row.email_candidates,
    opportunity_signal: row.opportunity_signal,
    website_reachable: row.website_reachable,
    website_title: row.website_title,
    meta_description: row.meta_description,
    homepage_headings: row.homepage_headings,
    social_links: row.social_links,
    contact_url: row.contact_url,
    has_contact_page: row.has_contact_page,
    active_social: row.active_social,
    gbp_profile_signal: row.gbp_profile_signal,
    competitor_density_1mi: row.competitor_density_1mi,
    price_level: row.price_level
  };
}

export function mapPlaceToResult(
  place: GoogleNearbyPlace,
  detail: Record<string, unknown>
): SearchBusinessResult {
  const lat =
    (detail.geometry as { location?: { lat?: number } })?.location?.lat ?? null;
  const lng =
    (detail.geometry as { location?: { lng?: number } })?.location?.lng ?? null;

  return {
    placeId: String(place.place_id ?? ""),
    name: String(detail.name ?? place.name ?? ""),
    address: String(detail.formatted_address ?? place.vicinity ?? ""),
    phone: String(detail.formatted_phone_number ?? ""),
    website: String(detail.website ?? ""),
    mapsUrl:
      String(detail.url ?? "") ||
      (lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : ""),
    rating: (detail.rating as number | undefined) ?? place.rating ?? null,
    reviewCount:
      (detail.user_ratings_total as number | undefined) ?? place.user_ratings_total ?? null,
    openNow:
      (detail.opening_hours as { open_now?: boolean } | undefined)?.open_now ??
      place.opening_hours?.open_now ??
      null,
    businessStatus: String(detail.business_status ?? ""),
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null
  };
}

export async function resolveFreeEnrichment(input: {
  request: Request;
  userId?: string | null;
  canExport: boolean;
  category: string;
  apiKey: string;
  filteredPlaces: GoogleNearbyPlace[];
  placeDetails: Array<Record<string, unknown>>;
  previewCount: number;
}) {
  const freeRunStatus = await getFreeRunStatus(input.request, input.userId);

  if (input.canExport) {
    return {
      enrichedResults: [] as EnrichedPreviewRow[],
      enrichmentBlocked: false,
      enrichmentMessage: "",
      freeRunsUsed: freeRunStatus.runsUsed,
      freeRunsRemaining: freeRunStatus.runsRemaining,
      freeRunsLimit: FREE_LIFETIME_RUNS,
      requiresSignInForEnrichment: false
    };
  }

  const access = await evaluateFreeRunAccess(input.request, input.userId);

  if (!access.allowed) {
    const message =
      access.reason === "sign_in_required"
        ? "Create a free account to use your remaining free analyses."
        : "You've used all 3 free analyses — buy credits to keep going.";

    return {
      enrichedResults: [] as EnrichedPreviewRow[],
      enrichmentBlocked: true,
      enrichmentMessage: message,
      freeRunsUsed: access.runsUsed,
      freeRunsRemaining: access.runsRemaining,
      freeRunsLimit: FREE_LIFETIME_RUNS,
      requiresSignInForEnrichment: access.reason === "sign_in_required"
    };
  }

  const enrichCount = Math.min(
    FREE_RUN_ENRICHED_COUNT,
    input.previewCount,
    input.filteredPlaces.length
  );

  if (enrichCount <= 0) {
    return {
      enrichedResults: [] as EnrichedPreviewRow[],
      enrichmentBlocked: false,
      enrichmentMessage: "",
      freeRunsUsed: freeRunStatus.runsUsed,
      freeRunsRemaining: freeRunStatus.runsRemaining,
      freeRunsLimit: FREE_LIFETIME_RUNS,
      requiresSignInForEnrichment: false
    };
  }

  const enrichPlaces = input.filteredPlaces.slice(0, enrichCount);
  const { rows } = await processPlacesBatch({
    places: enrichPlaces,
    startIndex: 0,
    batchSize: enrichPlaces.length,
    category: input.category,
    apiKey: input.apiKey,
    allPlacesForDensity: input.filteredPlaces
  });

  const usage = await recordFreeRunUsage(input.request, input.userId);

  return {
    enrichedResults: rows.map(mapExportRowToPreview),
    enrichmentBlocked: false,
    enrichmentMessage: "",
    freeRunsUsed: usage.runsUsed,
    freeRunsRemaining: usage.runsRemaining,
    freeRunsLimit: FREE_LIFETIME_RUNS,
    requiresSignInForEnrichment: false
  };
}

export function buildFilteredPlaceSet(
  uniquePlaces: GoogleNearbyPlace[],
  details: Array<Record<string, unknown>>,
  body: Record<string, unknown>
) {
  const filters = parseSearchFilters(body);
  const items: PlaceWithDetails[] = uniquePlaces.map((place, index) => ({
    place,
    detail: details[index] as PlaceWithDetails["detail"]
  }));
  const { filtered, excludedCount } = applySearchFilters(items, filters);

  return {
    filters,
    filteredPlaces: filtered.map((item) => item.place),
    excludedCount
  };
}

export const FREE_SEARCH_RADIUS_LIMIT_METERS = FREE_RADIUS_LIMIT_METERS;
