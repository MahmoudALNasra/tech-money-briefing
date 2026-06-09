import { NextResponse } from "next/server";

import { enforceBusinessDataSecurity } from "@/lib/business-data-security";
import { ESTIMATED_COSTS_USD, logUsageEvent } from "@/lib/business-data-tokens";

type AutocompletePrediction = {
  description?: string;
  place_id?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  types?: string[];
};

type PlaceDetails = {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  types?: string[];
};

function getGooglePlacesKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    ""
  ).trim();
}

function cleanQuery(value: string | null) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 140);
}

async function googleJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TechRevenueBriefBusinessData/1.0"
    },
    signal: AbortSignal.timeout(12000)
  });
  const json = (await response.json()) as T & {
    status?: string;
    error_message?: string;
  };

  if (!response.ok || (json.status && json.status !== "OK" && json.status !== "ZERO_RESULTS")) {
    throw new Error(json.error_message ?? `Google Places failed: ${json.status}`);
  }

  return json;
}

async function getPlaceDetails(placeId: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,formatted_address,geometry,types");
  url.searchParams.set("key", apiKey);

  const json = await googleJson<{ result?: PlaceDetails }>(url.toString());
  return json.result ?? {};
}

export async function GET(request: Request) {
  try {
    const security = await enforceBusinessDataSecurity({ request, action: "places" });

    if (!security.ok) {
      return NextResponse.json({ error: security.error }, { status: security.status });
    }

    const { searchParams } = new URL(request.url);
    const query = cleanQuery(searchParams.get("q"));

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const apiKey = getGooglePlacesKey();

    if (!apiKey) {
      return NextResponse.json({
        provider: "demo",
        suggestions: [
          {
            placeId: "demo-jeddah",
            label: `${query} near Jeddah`,
            secondaryLabel: "Demo suggestion - add GOOGLE_PLACES_API_KEY for live Google Maps results",
            lat: 21.4858,
            lng: 39.1925,
            types: ["locality"]
          }
        ]
      });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", query);
    url.searchParams.set("key", apiKey);

    const json = await googleJson<{ predictions?: AutocompletePrediction[] }>(
      url.toString()
    );

    const predictions = (json.predictions ?? []).slice(0, 6);
    const details = await Promise.all(
      predictions.map((prediction) =>
        prediction.place_id ? getPlaceDetails(prediction.place_id, apiKey) : null
      )
    );

    await logUsageEvent({
      sessionKey: request.headers.get("x-trb-session"),
      eventType: "places_autocomplete",
      tokensCharged: 0,
      estimatedCostUsd: ESTIMATED_COSTS_USD.placesAutocomplete,
      metadata: { query, suggestion_count: predictions.length }
    });

    return NextResponse.json({
      provider: "google_places",
      suggestions: predictions.map((prediction, index) => {
        const detail = details[index];
        return {
          placeId: prediction.place_id ?? "",
          label:
            detail?.name ??
            prediction.structured_formatting?.main_text ??
            prediction.description ??
            "",
          secondaryLabel:
            detail?.formatted_address ??
            prediction.structured_formatting?.secondary_text ??
            "",
          lat: detail?.geometry?.location?.lat ?? null,
          lng: detail?.geometry?.location?.lng ?? null,
          types: detail?.types ?? prediction.types ?? []
        };
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
