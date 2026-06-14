import { NextResponse } from "next/server";

import { BUSINESS_DATA_CATEGORY_VALUES } from "@/lib/business-data-categories";
import { getUserFromRequest } from "@/lib/business-data-auth";
import { checkKeyedRateLimit, getClientIdentity } from "@/lib/business-data-rate-limit";
import { enforceBusinessDataSecurity } from "@/lib/business-data-security";
import { generateSubscriberId } from "@/lib/subscriber-id";
import { supabase } from "@/lib/supabase";
import {
  BUSINESS_DATA_REPORT_LIMITS,
  ESTIMATED_COSTS_USD,
  getBusinessDataExportTokenCost,
  getWalletBalance,
  logBusinessDataSearch,
  logUsageEvent,
} from "@/lib/business-data-tokens";

type GoogleGeocodeResult = {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

type GoogleNearbyPlace = {
  place_id?: string;
  name?: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
};

type GooglePlaceDetails = {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

const freePreviewLimit = 3;
const paidPreviewLimit = 10;
const freeRadiusLimitMeters = 1609;
const maxFreeRadiusMeters = 8047;
const subscriberCounterLimit = 60;
const freePreviewDailyLimit = Number(process.env.BUSINESS_DATA_FREE_PREVIEW_DAILY_LIMIT ?? "5");
const freePreviewWindowMs = 24 * 60 * 60 * 1000;

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function cleanHeaderText(value: string | null, maxLength: number) {
  if (!value) {
    return null;
  }

  try {
    return cleanText(decodeURIComponent(value), maxLength) || null;
  } catch {
    return cleanText(value, maxLength) || null;
  }
}

function getVisitorGeo(request: Request) {
  return {
    country: cleanHeaderText(request.headers.get("x-vercel-ip-country"), 8),
    region: cleanHeaderText(request.headers.get("x-vercel-ip-country-region"), 32),
    city: cleanHeaderText(request.headers.get("x-vercel-ip-city"), 80)
  };
}

function clampRadius(value: unknown) {
  const radius = Number(value);

  if (!Number.isFinite(radius)) {
    return 1000;
  }

  return Math.min(Math.max(Math.round(radius), 500), maxFreeRadiusMeters);
}

function readCoordinate(value: unknown) {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function addBusinessDataUserToNewsletter(email?: string) {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
    return;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from("subscribers").insert({
      id: generateSubscriberId(),
      email: normalizedEmail,
      source: "business_data_free_account"
    });

    if (!error || (error.code === "23505" && error.message.includes("email"))) {
      return;
    }

    if (error.code !== "23505") {
      console.error("[business-data-newsletter]", error.message);
      return;
    }
  }
}

function enforceFreePreviewLimit(request: Request, userId?: string) {
  const identity = getClientIdentity(request);
  const accountType = userId ? "account" : "ip";
  const limit = checkKeyedRateLimit({
    key: userId
      ? `business-data:free-preview:account:${userId}`
      : `business-data:free-preview:ip:${identity.ip}`,
    limit: freePreviewDailyLimit,
    windowMs: freePreviewWindowMs
  });

  if (limit.allowed) {
    return { ok: true as const, accountType, remaining: limit.remaining };
  }

  return {
    ok: false as const,
    accountType,
    remaining: 0,
    retryAfterMs: limit.retryAfterMs ?? 0
  };
}

function getGooglePlacesKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    ""
  ).trim();
}

function demoResponse(location: string, category: string, radiusMeters: number) {
  return {
    provider: "demo" as const,
    query: { location, category, radiusMeters },
    center: {
      lat: 21.4858,
      lng: 39.1925,
      label: location || "Jeddah, Saudi Arabia"
    },
    paidAccess: false,
    previewLimit: freePreviewLimit,
    totalAvailableEstimate: 24,
    lockedCount: 21,
    results: [
      {
        placeId: "demo-restaurant-1",
        name: "Demo Local Cafe",
        address: "Sample district, Jeddah",
        phone: "+966500000001",
        website: "https://example.com",
        mapsUrl: "https://www.google.com/maps",
        rating: 4.6,
        reviewCount: 132,
        openNow: true,
        lat: 21.4858,
        lng: 39.1925
      },
      {
        placeId: "demo-restaurant-2",
        name: "Demo Business Center",
        address: "Sample road, Jeddah",
        phone: "+966500000002",
        website: "",
        mapsUrl: "https://www.google.com/maps",
        rating: 4.2,
        reviewCount: 58,
        openNow: null,
        lat: 21.491,
        lng: 39.19
      },
      {
        placeId: "demo-restaurant-3",
        name: "Demo Market Shop",
        address: "Sample mall, Jeddah",
        phone: "",
        website: "https://example.org",
        mapsUrl: "https://www.google.com/maps",
        rating: 4.8,
        reviewCount: 244,
        openNow: false,
        lat: 21.48,
        lng: 39.2
      }
    ]
  };
}

async function googleJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TechRevenueBriefBusinessData/1.0"
    },
    signal: AbortSignal.timeout(15000)
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

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeLocation(location: string, apiKey: string) {
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

async function resolveSearchCenter(input: {
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

async function nearbySearch(input: {
  lat: number;
  lng: number;
  category: string;
  radiusMeters: number;
  apiKey: string;
}) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${input.lat},${input.lng}`);
  url.searchParams.set("radius", String(input.radiusMeters));
  url.searchParams.set("type", input.category);
  url.searchParams.set("key", input.apiKey);

  const json = await googleJson<{
    results?: GoogleNearbyPlace[];
    next_page_token?: string;
  }>(url.toString());

  return {
    places: json.results ?? [],
    hasMorePages: Boolean(json.next_page_token),
    nextPageToken: json.next_page_token
  };
}

async function nearbySearchForSubscriberCounter(input: {
  lat: number;
  lng: number;
  category: string;
  radiusMeters: number;
  apiKey: string;
}) {
  const places: GoogleNearbyPlace[] = [];
  let nextPageToken: string | undefined;

  for (let page = 0; page < 3 && places.length < subscriberCounterLimit; page += 1) {
    if (nextPageToken) {
      await sleep(2200);
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("key", input.apiKey);

    if (nextPageToken) {
      url.searchParams.set("pagetoken", nextPageToken);
    } else {
      url.searchParams.set("location", `${input.lat},${input.lng}`);
      url.searchParams.set("radius", String(input.radiusMeters));
      url.searchParams.set("type", input.category);
    }

    const json = await googleJson<{
      results?: GoogleNearbyPlace[];
      next_page_token?: string;
    }>(url.toString());

    places.push(...(json.results ?? []));
    nextPageToken = json.next_page_token;

    if (!nextPageToken) {
      break;
    }
  }

  return {
    places,
    hasMorePages: Boolean(nextPageToken)
  };
}

async function placeDetails(placeId: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "website",
      "url",
      "rating",
      "user_ratings_total",
      "opening_hours",
      "geometry"
    ].join(",")
  );
  url.searchParams.set("key", apiKey);

  const json = await googleJson<{ result?: GooglePlaceDetails }>(url.toString());
  return json.result ?? {};
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const turnstileToken = cleanText(body.turnstileToken, 4000);

    const security = await enforceBusinessDataSecurity({
      request,
      action: "search",
      turnstileToken: turnstileToken || null
    });

    if (!security.ok) {
      return NextResponse.json({ error: security.error }, { status: security.status });
    }

    const user = await getUserFromRequest(request);
    const location = cleanText(body.location, 140);
    const category = cleanText(body.category, 60);
    const radiusMeters = clampRadius(body.radiusMeters);
    const tokenBalance = user ? await getWalletBalance(user.id) : 0;
    const minReportTokenCost = getBusinessDataExportTokenCost(BUSINESS_DATA_REPORT_LIMITS.min);
    const canExport = tokenBalance >= minReportTokenCost;
    const previewLimit = canExport ? paidPreviewLimit : freePreviewLimit;
    const resultLimit = previewLimit;
    const visitorGeo = getVisitorGeo(request);

    if (!canExport && radiusMeters > freeRadiusLimitMeters) {
      return NextResponse.json(
        { error: "Radius above 1 mile is available to subscribers." },
        { status: 402 }
      );
    }

    if (!BUSINESS_DATA_CATEGORY_VALUES.has(category)) {
      return badRequest("Choose a supported business category.");
    }

    const apiKey = getGooglePlacesKey();
    const bodyCenter =
      typeof body.center === "object" && body.center
        ? (body.center as Record<string, unknown>)
        : null;
    const selectedLat = readCoordinate(bodyCenter?.lat);
    const selectedLng = readCoordinate(bodyCenter?.lng);

    if (!location && (selectedLat === null || selectedLng === null)) {
      return badRequest("Search for a place or drop a pin on the map.");
    }

    if (!canExport) {
      if (user?.email) {
        await addBusinessDataUserToNewsletter(user.email);
      }

      const freePreviewUsage = enforceFreePreviewLimit(request, user?.id);

      if (!freePreviewUsage.ok) {
        return NextResponse.json(
          {
            error: user
              ? "You have used your 5 free account previews for now. Get the full lead report to keep searching, scan wider areas, and export enriched leads."
              : "You have used your 5 free previews for this IP address today. Create a free account to get 5 more previews, or get the full lead report.",
            freePreviewLimit: freePreviewDailyLimit,
            freePreviewAccountType: freePreviewUsage.accountType,
            retryAfterMs: freePreviewUsage.retryAfterMs
          },
          { status: 402 }
        );
      }
    }

    if (!apiKey) {
      const demo = demoResponse(location, category, radiusMeters);

      await logUsageEvent({
        userId: user?.id ?? null,
        sessionKey: request.headers.get("x-trb-session"),
        eventType: "preview_search",
        tokensCharged: 0,
        estimatedCostUsd: 0,
        metadata: {
          category,
          location,
          radius_meters: radiusMeters,
          result_count: demo.results.length,
          total_available_estimate: demo.totalAvailableEstimate,
          paid_access: demo.paidAccess,
          provider: "demo",
          center_label: demo.center.label,
          visitor_country: visitorGeo.country,
          visitor_region: visitorGeo.region,
          visitor_city: visitorGeo.city,
          result_names: demo.results.map((result) => result.name).slice(0, 5)
        }
      });

      await logBusinessDataSearch({
        userId: user?.id ?? null,
        sessionKey: request.headers.get("x-trb-session"),
        category,
        location,
        centerLabel: demo.center.label,
        visitorCountry: visitorGeo.country,
        visitorRegion: visitorGeo.region,
        visitorCity: visitorGeo.city,
        radiusMeters,
        resultCount: demo.results.length,
        totalAvailableEstimate: demo.totalAvailableEstimate,
        paidAccess: demo.paidAccess,
        provider: "demo",
        estimatedCostUsd: 0,
        resultNames: demo.results.map((result) => result.name).slice(0, 5)
      });

      return NextResponse.json(demo);
    }

    const center = await resolveSearchCenter({ body, location, apiKey });
    const nearby = canExport
      ? await nearbySearchForSubscriberCounter({
          lat: center.lat,
          lng: center.lng,
          category,
          radiusMeters,
          apiKey
        })
      : await nearbySearch({
          lat: center.lat,
          lng: center.lng,
          category,
          radiusMeters,
          apiKey
        });

    const uniquePlaces = Array.from(
      new Map(
        nearby.places
          .filter((place) => place.place_id)
          .map((place) => [place.place_id as string, place])
      ).values()
    );

    const previewPlaces = uniquePlaces.slice(0, resultLimit);
    const details = await Promise.all(
      previewPlaces.map((place) => placeDetails(place.place_id as string, apiKey))
    );

    const results = previewPlaces.map((place, index) => {
      const detail = details[index];
      const lat = detail.geometry?.location?.lat ?? null;
      const lng = detail.geometry?.location?.lng ?? null;

      return {
        placeId: place.place_id ?? "",
        name: detail.name ?? place.name ?? "",
        address: detail.formatted_address ?? place.vicinity ?? "",
        phone: detail.formatted_phone_number ?? "",
        website: detail.website ?? "",
        mapsUrl:
          detail.url ??
          (lat && lng
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            : ""),
        rating: detail.rating ?? place.rating ?? null,
        reviewCount: detail.user_ratings_total ?? place.user_ratings_total ?? null,
        openNow: detail.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
        lat,
        lng
      };
    });

    const totalAvailableEstimate = canExport
      ? uniquePlaces.length
      : uniquePlaces.length + (nearby.hasMorePages ? 20 : 0);

    await logUsageEvent({
      userId: user?.id ?? null,
      sessionKey: request.headers.get("x-trb-session"),
      eventType: "preview_search",
      tokensCharged: 0,
      estimatedCostUsd: ESTIMATED_COSTS_USD.previewSearch,
      metadata: {
        category,
        location,
        radius_meters: radiusMeters,
        result_count: results.length,
        total_available_estimate: totalAvailableEstimate,
        paid_access: canExport,
        provider: "google_places",
        center_label: center.label,
        visitor_country: visitorGeo.country,
        visitor_region: visitorGeo.region,
        visitor_city: visitorGeo.city,
        result_names: results.map((result) => result.name).filter(Boolean).slice(0, 5)
      }
    });

    await logBusinessDataSearch({
      userId: user?.id ?? null,
      sessionKey: request.headers.get("x-trb-session"),
      category,
      location,
      centerLabel: center.label,
      centerLat: center.lat,
      centerLng: center.lng,
      visitorCountry: visitorGeo.country,
      visitorRegion: visitorGeo.region,
      visitorCity: visitorGeo.city,
      radiusMeters,
      resultCount: results.length,
      totalAvailableEstimate,
      paidAccess: canExport,
      provider: "google_places",
      estimatedCostUsd: ESTIMATED_COSTS_USD.previewSearch,
      resultNames: results.map((result) => result.name).filter(Boolean).slice(0, 5)
    });

    return NextResponse.json({
      provider: "google_places",
      query: { location, category, radiusMeters },
      center,
      paidAccess: canExport,
      tokenBalance,
      exportTokenCost: minReportTokenCost,
      previewLimit,
      totalAvailableEstimate,
      lockedCount: Math.max(totalAvailableEstimate - results.length, 0),
      results
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
