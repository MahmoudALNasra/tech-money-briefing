import {
  enrichWebsite,
  generateBusinessAiInsight,
  mapWithConcurrency,
  type BusinessAiInsight
} from "@/lib/business-data-export-ai";
import {
  buildPlaceDataHash,
  extractCachedEnrichmentFields,
  getCachedEnrichment,
  upsertCachedEnrichment
} from "@/lib/business-data-enrichment-cache";
import { computeCompetitorDensity } from "@/lib/business-data-search-filters";
import { parsePublicAreaLabel } from "@/lib/enrichment-public-context";

export const REPORT_BATCH_SIZE = 2;

export type GoogleNearbyPlace = {
  place_id?: string;
  name?: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  opening_hours?: {
    open_now?: boolean;
  };
};

export type GooglePlaceDetails = {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  price_level?: number;
  types?: string[];
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

export type ExportRow = {
  name: string;
  address: string;
  phone: string;
  international_phone: string;
  website: string;
  google_maps_url: string;
  rating: number | null;
  total_reviews: number | null;
  open_now: boolean | null;
  business_status: string;
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
  competitor_density_1mi: number;
  price_level: number | null;
  types: string;
  weekday_hours: string;
  place_id: string;
  lat: number | null;
  lng: number | null;
};

const maxRadiusMeters = 8047;

export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function clampRadius(value: unknown) {
  const radius = Number(value);

  if (!Number.isFinite(radius)) {
    return 1000;
  }

  return Math.min(Math.max(Math.round(radius), 500), maxRadiusMeters);
}

export function readCoordinate(value: unknown) {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
}

export function getGooglePlacesKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    ""
  ).trim();
}

export function getExportLimit() {
  const configured = Number(process.env.BUSINESS_DATA_EXPORT_MAX_RESULTS);

  if (!Number.isFinite(configured)) {
    return 60;
  }

  return Math.min(Math.max(Math.round(configured), 5), 60);
}

export function csvEscape(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: ExportRow[]) {
  const headers = [
    "name",
    "address",
    "phone",
    "international_phone",
    "website",
    "google_maps_url",
    "rating",
    "total_reviews",
    "open_now",
    "business_status",
    "email_candidates",
    "website_reachable",
    "website_title",
    "meta_description",
    "homepage_headings",
    "social_links",
    "contact_url",
    "has_contact_page",
    "opportunity_signal",
    "website_analysis",
    "business_opportunity_summary",
    "recommended_pitch",
    "pitch_angle",
    "active_social",
    "gbp_profile_signal",
    "competitor_density_1mi",
    "price_level",
    "types",
    "weekday_hours",
    "place_id",
    "lat",
    "lng"
  ] as const;

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function googleJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TechRevenueBriefBusinessData/1.0"
    },
    signal: AbortSignal.timeout(20000)
  });
  const json = (await response.json()) as T & {
    status?: string;
    error_message?: string;
  };

  if (!response.ok || (json.status && !["OK", "ZERO_RESULTS"].includes(json.status))) {
    throw new Error(json.error_message ?? `Google Places failed: ${json.status}`);
  }

  return json;
}

type GoogleGeocodeResult = {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

export async function geocodeLocation(location: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", location);
  url.searchParams.set("key", apiKey);

  const json = await googleJson<{ results?: GoogleGeocodeResult[] }>(url.toString());
  const first = json.results?.[0];
  const lat = first?.geometry?.location?.lat;
  const lng = first?.geometry?.location?.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("We could not find that location. Try a city, area, or full address.");
  }

  return {
    lat,
    lng,
    label: first?.formatted_address ?? location
  };
}

export async function resolveSearchCenter(input: {
  body: Record<string, unknown>;
  location: string;
  apiKey: string;
}) {
  const center =
    typeof input.body.center === "object" && input.body.center
      ? (input.body.center as Record<string, unknown>)
      : null;
  const lat = readCoordinate(center?.lat);
  const lng = readCoordinate(center?.lng);
  const label = cleanText(center?.label, 180);

  if (lat !== null && lng !== null) {
    return {
      lat,
      lng,
      label: label || input.location || "Pinned map location"
    };
  }

  return geocodeLocation(input.location, input.apiKey);
}

async function nearbyPage(input: {
  apiKey: string;
  lat: number;
  lng: number;
  category: string;
  radiusMeters: number;
  pageToken?: string;
}) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("key", input.apiKey);

  if (input.pageToken) {
    url.searchParams.set("pagetoken", input.pageToken);
  } else {
    url.searchParams.set("location", `${input.lat},${input.lng}`);
    url.searchParams.set("radius", String(input.radiusMeters));
    url.searchParams.set("type", input.category);
  }

  return googleJson<{
    results?: GoogleNearbyPlace[];
    next_page_token?: string;
  }>(url.toString());
}

export async function nearbySearchAll(input: {
  apiKey: string;
  lat: number;
  lng: number;
  category: string;
  radiusMeters: number;
  limit: number;
}) {
  const places: GoogleNearbyPlace[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3 && places.length < input.limit; page += 1) {
    if (pageToken) {
      await sleep(2200);
    }

    const json = await nearbyPage({ ...input, pageToken });
    places.push(...(json.results ?? []));
    pageToken = json.next_page_token;

    if (!pageToken) {
      break;
    }
  }

  return Array.from(
    new Map(
      places
        .filter((place) => place.place_id)
        .map((place) => [place.place_id as string, place])
    ).values()
  ).slice(0, input.limit);
}

export async function placeDetails(placeId: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "url",
      "rating",
      "user_ratings_total",
      "business_status",
      "price_level",
      "types",
      "opening_hours",
      "geometry"
    ].join(",")
  );
  url.searchParams.set("key", apiKey);

  const json = await googleJson<{ result?: GooglePlaceDetails }>(url.toString());
  return json.result ?? {};
}

function hasActiveSocial(socialLinks: string[]) {
  return socialLinks.some((link) => /instagram\.com|facebook\.com/i.test(link));
}

function buildGbpProfileSignal(detail: GooglePlaceDetails) {
  const reviewCount = detail.user_ratings_total ?? 0;
  const hasPhone = Boolean(detail.formatted_phone_number);
  const hasWebsite = Boolean(detail.website);
  const status = String(detail.business_status ?? "").toUpperCase();

  if (status === "CLOSED_PERMANENTLY") {
    return "Permanently closed on Google.";
  }

  if (!hasPhone && !hasWebsite && reviewCount < 5) {
    return "Likely unclaimed or lightly maintained Google profile.";
  }

  if (hasPhone && reviewCount >= 20) {
    return "Established Google Business Profile with review history.";
  }

  return "Google profile present, but contact and review signals are mixed.";
}

export async function processPlacesBatch(input: {
  places: GoogleNearbyPlace[];
  startIndex: number;
  batchSize: number;
  category: string;
  apiKey: string;
  allPlacesForDensity?: GoogleNearbyPlace[];
}): Promise<{ rows: ExportRow[]; nextIndex: number }> {
  const slice = input.places.slice(input.startIndex, input.startIndex + input.batchSize);

  if (slice.length === 0) {
    return { rows: [], nextIndex: input.startIndex };
  }

  const densityPool =
    input.allPlacesForDensity?.map((place) => ({
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
      types: place.types
    })) ?? [];

  const details = await mapWithConcurrency(slice, 6, (place) =>
    placeDetails(place.place_id as string, input.apiKey)
  );

  const rows: ExportRow[] = [];

  for (let index = 0; index < slice.length; index += 1) {
    const place = slice[index];
    const detail = details[index];
    const placeId = place.place_id ?? "";
    const placeHash = buildPlaceDataHash(detail);
    const cached = placeId ? await getCachedEnrichment(placeId) : null;
    const lat = detail.geometry?.location?.lat ?? null;
    const lng = detail.geometry?.location?.lng ?? null;
    const name = detail.name ?? place.name ?? "";
    const competitorDensity = computeCompetitorDensity(
      {
        lat,
        lng,
        types: detail.types ?? place.types
      },
      densityPool
    );
    const priceLevel =
      typeof detail.price_level === "number" ? detail.price_level : null;

    let enrichmentFields = cached?.enrichment ?? null;

    if (!enrichmentFields || cached?.sourcePlaceDataHash !== placeHash) {
      const enrichment = await enrichWebsite(detail.website ?? "");
      const insight: BusinessAiInsight = await generateBusinessAiInsight({
        name,
        category: input.category,
        address: detail.formatted_address ?? place.vicinity ?? "",
        phone: detail.formatted_phone_number ?? "",
        website: detail.website ?? "",
        googleMapsUrl:
          detail.url ??
          (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : ""),
        rating: detail.rating ?? place.rating ?? null,
        totalReviews: detail.user_ratings_total ?? place.user_ratings_total ?? null,
        openNow: detail.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
        businessStatus: detail.business_status ?? "",
        types: (detail.types ?? []).join("|"),
        weekdayHours: (detail.opening_hours?.weekday_text ?? []).join(" | "),
        enrichment
      });

      enrichmentFields = {
        email_candidates: enrichment.emailCandidates.join(" | "),
        website_reachable: enrichment.websiteReachable,
        website_title: enrichment.websiteTitle,
        meta_description: enrichment.metaDescription,
        homepage_headings: enrichment.homepageHeadings.join(" | "),
        social_links: enrichment.socialLinks.join(" | "),
        contact_url: enrichment.contactUrl,
        has_contact_page: enrichment.hasContactPage,
        opportunity_signal: enrichment.signal,
        website_analysis: insight.website_analysis,
        business_opportunity_summary: insight.business_opportunity_summary,
        recommended_pitch: insight.recommended_pitch,
        pitch_angle: insight.pitch_angle,
        active_social: hasActiveSocial(enrichment.socialLinks),
        gbp_profile_signal: buildGbpProfileSignal(detail),
        price_level: priceLevel,
        competitor_density_1mi: competitorDensity
      };

      if (placeId) {
        await upsertCachedEnrichment({
          placeId,
          sourcePlaceDataHash: placeHash,
          enrichment: enrichmentFields,
          searchCategory: input.category,
          areaLabel: parsePublicAreaLabel(detail.formatted_address ?? place.vicinity ?? "")
        });
      }
    }

    rows.push({
      name,
      address: detail.formatted_address ?? place.vicinity ?? "",
      phone: detail.formatted_phone_number ?? "",
      international_phone: detail.international_phone_number ?? "",
      website: detail.website ?? "",
      google_maps_url:
        detail.url ??
        (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : ""),
      rating: detail.rating ?? place.rating ?? null,
      total_reviews: detail.user_ratings_total ?? place.user_ratings_total ?? null,
      open_now: detail.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
      business_status: detail.business_status ?? "",
      ...extractCachedEnrichmentFields(enrichmentFields),
      price_level: priceLevel ?? enrichmentFields.price_level ?? null,
      competitor_density_1mi: competitorDensity,
      types: (detail.types ?? []).join("|"),
      weekday_hours: (detail.opening_hours?.weekday_text ?? []).join(" | "),
      place_id: placeId,
      lat,
      lng
    });
  }

  return {
    rows,
    nextIndex: input.startIndex + slice.length
  };
}

export function buildExportMeta(rows: ExportRow[], debitBalance: number, creditsCharged: number) {
  const emailsFound = rows.filter((row) => String(row.email_candidates ?? "").length > 0).length;
  const pitchesGenerated = rows.filter((row) => String(row.recommended_pitch ?? "").length > 0)
    .length;

  return {
    rowCount: rows.length,
    emailsFound,
    pitchesGenerated,
    tokensCharged: creditsCharged,
    creditsCharged,
    balance: debitBalance
  };
}
