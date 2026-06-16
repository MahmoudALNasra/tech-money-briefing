import type { GoogleNearbyPlace, GooglePlaceDetails } from "@/lib/business-data-export-core";

export type WebsiteFilter = "any" | "has" | "none";

export type SearchFilters = {
  minRating?: number;
  maxRating?: number;
  minReviewCount?: number;
  maxReviewCount?: number;
  openNowOnly?: boolean;
  excludePermanentlyClosed?: boolean;
  websiteFilter?: WebsiteFilter;
  excludePlaceIds?: string[];
  excludeNames?: string[];
};

export type ReportGenerationFilters = {
  pitchAngles?: string[];
  hasEmailCandidate?: "any" | "yes" | "no";
  websiteReachable?: "any" | "yes" | "no";
};

export type PlaceWithDetails = {
  place: GoogleNearbyPlace;
  detail?: GooglePlaceDetails;
  website?: string;
};

export function parseSearchFilters(body: Record<string, unknown>): SearchFilters {
  const filters =
    typeof body.filters === "object" && body.filters
      ? (body.filters as Record<string, unknown>)
      : {};

  const minRating = Number(filters.minRating);
  const maxRating = Number(filters.maxRating);
  const minReviewCount = Number(filters.minReviewCount);
  const maxReviewCount = Number(filters.maxReviewCount);

  return {
    minRating: Number.isFinite(minRating) ? minRating : undefined,
    maxRating: Number.isFinite(maxRating) ? maxRating : undefined,
    minReviewCount:
      Number.isFinite(minReviewCount) && minReviewCount >= 0 ? Math.round(minReviewCount) : undefined,
    maxReviewCount:
      Number.isFinite(maxReviewCount) && maxReviewCount >= 0 ? Math.round(maxReviewCount) : undefined,
    openNowOnly: Boolean(filters.openNowOnly),
    excludePermanentlyClosed: filters.excludePermanentlyClosed !== false,
    websiteFilter: ["any", "has", "none"].includes(String(filters.websiteFilter ?? ""))
      ? (String(filters.websiteFilter) as WebsiteFilter)
      : "any",
    excludePlaceIds: parseStringList(filters.excludePlaceIds, 80),
    excludeNames: parseStringList(filters.excludeNames, 40)
  };
}

export function parseReportFilters(body: Record<string, unknown>): ReportGenerationFilters {
  const filters =
    typeof body.reportFilters === "object" && body.reportFilters
      ? (body.reportFilters as Record<string, unknown>)
      : {};

  const pitchAngles = Array.isArray(filters.pitchAngles)
    ? filters.pitchAngles.map((value) => String(value).trim()).filter(Boolean).slice(0, 12)
    : undefined;

  return {
    pitchAngles,
    hasEmailCandidate: ["any", "yes", "no"].includes(String(filters.hasEmailCandidate ?? ""))
      ? (String(filters.hasEmailCandidate) as "any" | "yes" | "no")
      : "any",
    websiteReachable: ["any", "yes", "no"].includes(String(filters.websiteReachable ?? ""))
      ? (String(filters.websiteReachable) as "any" | "yes" | "no")
      : "any"
  };
}

function parseStringList(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function applySearchFilters(
  items: PlaceWithDetails[],
  filters: SearchFilters
): { filtered: PlaceWithDetails[]; excludedCount: number } {
  const excludeIds = new Set(
    (filters.excludePlaceIds ?? []).map((value) => value.trim()).filter(Boolean)
  );
  const excludeNames = (filters.excludeNames ?? [])
    .map(normalizeName)
    .filter(Boolean);

  const filtered = items.filter(({ place, detail }) => {
    const placeId = String(place.place_id ?? "");
    const name = normalizeName(detail?.name ?? place.name ?? "");
    const rating = detail?.rating ?? place.rating ?? null;
    const reviewCount = detail?.user_ratings_total ?? place.user_ratings_total ?? null;
    const openNow = detail?.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null;
    const businessStatus = String(detail?.business_status ?? "").toUpperCase();
    const website = String(detail?.website ?? "").trim();

    if (excludeIds.has(placeId)) {
      return false;
    }

    if (excludeNames.some((needle) => needle && name.includes(needle))) {
      return false;
    }

    if (filters.excludePermanentlyClosed !== false && businessStatus === "CLOSED_PERMANENTLY") {
      return false;
    }

    if (filters.minRating !== undefined && (rating ?? 0) < filters.minRating) {
      return false;
    }

    if (filters.maxRating !== undefined && (rating ?? 0) > filters.maxRating) {
      return false;
    }

    if (filters.minReviewCount !== undefined && (reviewCount ?? 0) < filters.minReviewCount) {
      return false;
    }

    if (filters.maxReviewCount !== undefined && (reviewCount ?? 0) > filters.maxReviewCount) {
      return false;
    }

    if (filters.openNowOnly && openNow !== true) {
      return false;
    }

    if (filters.websiteFilter === "has" && !website) {
      return false;
    }

    if (filters.websiteFilter === "none" && website) {
      return false;
    }

    return true;
  });

  return {
    filtered,
    excludedCount: Math.max(items.length - filtered.length, 0)
  };
}

export function computeCompetitorDensity(
  place: { lat: number | null; lng: number | null; types?: string[] },
  allPlaces: Array<{ lat: number | null; lng: number | null; types?: string[] }>
) {
  if (place.lat === null || place.lng === null) {
    return 0;
  }

  const primaryTypes = new Set((place.types ?? []).slice(0, 3));

  return allPlaces.filter((candidate) => {
    if (candidate.lat === null || candidate.lng === null) {
      return false;
    }

    const distanceMeters = haversineMeters(place.lat!, place.lng!, candidate.lat, candidate.lng);
    if (distanceMeters > 1609) {
      return false;
    }

    if (primaryTypes.size === 0) {
      return true;
    }

    return (candidate.types ?? []).some((type) => primaryTypes.has(type));
  }).length;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export type EnrichedFilterRow = {
  place_id: string;
  pitch_angle?: string;
  email_candidates?: string;
  website_reachable?: boolean;
};

export function applyReportFilters(
  rows: EnrichedFilterRow[],
  filters: ReportGenerationFilters
) {
  return rows.filter((row) => {
    if (filters.pitchAngles?.length) {
      const pitch = String(row.pitch_angle ?? "").trim();
      if (!filters.pitchAngles.some((angle) => pitch === angle)) {
        return false;
      }
    }

    if (filters.hasEmailCandidate === "yes" && !String(row.email_candidates ?? "").trim()) {
      return false;
    }

    if (filters.hasEmailCandidate === "no" && String(row.email_candidates ?? "").trim()) {
      return false;
    }

    if (filters.websiteReachable === "yes" && !row.website_reachable) {
      return false;
    }

    if (filters.websiteReachable === "no" && row.website_reachable) {
      return false;
    }

    return true;
  });
}
