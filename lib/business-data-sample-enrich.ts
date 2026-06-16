import {
  nearbySearchAll,
  placeDetails,
  processPlacesBatch,
  resolveSearchCenter,
  type ExportRow
} from "@/lib/business-data-export-core";
import {
  applySearchFilters,
  parseSearchFilters,
  type PlaceWithDetails
} from "@/lib/business-data-search-filters";
import { SAMPLE_ENRICH_SIZE } from "@/lib/business-data-free-config";
import {
  debitTokens,
  ESTIMATED_COSTS_USD,
  getWalletBalance,
  logUsageEvent
} from "@/lib/business-data-tokens";
import { mapExportRowToPreview } from "@/lib/business-data-search-service";

export async function runSampleEnrich(input: {
  userId: string;
  body: Record<string, unknown>;
  apiKey: string;
  location: string;
  category: string;
  radiusMeters: number;
  sampleSize?: number;
}) {
  const sampleSize = Math.min(
    Math.max(input.sampleSize ?? SAMPLE_ENRICH_SIZE, 1),
    SAMPLE_ENRICH_SIZE
  );
  const balance = await getWalletBalance(input.userId);

  if (balance < sampleSize) {
    return {
      ok: false as const,
      error: `Not enough credits. Sample Enrich needs up to ${sampleSize} credits (1 per business).`,
      balance,
      required: sampleSize
    };
  }

  const center = await resolveSearchCenter({
    body: input.body,
    location: input.location,
    apiKey: input.apiKey
  });

  const searchFilters = parseSearchFilters(input.body);
  let places = await nearbySearchAll({
    apiKey: input.apiKey,
    lat: center.lat,
    lng: center.lng,
    category: input.category,
    radiusMeters: input.radiusMeters,
    limit: Math.max(sampleSize, 60)
  });

  if (places.length === 0) {
    return {
      ok: false as const,
      error: "No businesses matched this search. Try a wider radius or different category.",
      balance,
      required: sampleSize
    };
  }

  const details = await Promise.all(
    places.map((place) => placeDetails(place.place_id as string, input.apiKey))
  );
  const items: PlaceWithDetails[] = places.map((place, index) => ({
    place,
    detail: details[index]
  }));
  places = applySearchFilters(items, searchFilters).filtered.map((item) => item.place);

  if (places.length === 0) {
    return {
      ok: false as const,
      error: "No businesses passed your filters. Loosen Tier 1 filters and try again.",
      balance,
      required: sampleSize
    };
  }

  const enrichPlaces = places.slice(0, sampleSize);
  const { rows } = await processPlacesBatch({
    places: enrichPlaces,
    startIndex: 0,
    batchSize: enrichPlaces.length,
    category: input.category,
    apiKey: input.apiKey,
    allPlacesForDensity: places
  });

  const creditsToCharge = rows.length;
  const debit = await debitTokens({
    userId: input.userId,
    amount: creditsToCharge,
    reason: "sample_enrich",
    metadata: {
      category: input.category,
      location: input.location,
      sample_size: sampleSize,
      processed_count: creditsToCharge
    }
  });

  if (!debit.ok) {
    return {
      ok: false as const,
      error: "Not enough credits to complete Sample Enrich.",
      balance: debit.balance,
      required: creditsToCharge
    };
  }

  await logUsageEvent({
    userId: input.userId,
    eventType: "sample_enrich",
    tokensCharged: creditsToCharge,
    estimatedCostUsd:
      ESTIMATED_COSTS_USD.fullExport *
      (Math.max(creditsToCharge, 1) / SAMPLE_ENRICH_SIZE),
    metadata: {
      category: input.category,
      location: input.location,
      center_label: center.label,
      processed_count: creditsToCharge,
      balance_after: debit.balance
    }
  });

  return {
    ok: true as const,
    rows,
    previewRows: rows.map(mapExportRowToPreview),
    chargedPlaceIds: rows.map((row) => row.place_id),
    creditsCharged: creditsToCharge,
    balance: debit.balance,
    sampleSize: enrichPlaces.length
  };
}

export function exportRowsToEnrichedPreview(rows: ExportRow[]) {
  return rows.map(mapExportRowToPreview);
}
