import { BUSINESS_DATA_CATEGORIES } from "@/lib/business-data-categories";
import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import { getGooglePlacesKey, placeDetails } from "@/lib/business-data-export-core";
import { safeTrim } from "@/lib/safe-string";

export type EnrichmentPublicContext = {
  business_category_label: string;
  business_category_singular: string;
  area_label: string;
  area_phrase: string;
};

const CATEGORY_LABEL_BY_VALUE = new Map(
  BUSINESS_DATA_CATEGORIES.map((category) => [category.value, category.label])
);

const PITCH_CATEGORY_PATTERNS: Array<{ pattern: RegExp; label: string; singular: string }> = [
  { pattern: /\brestaurant\b/i, label: "Restaurants", singular: "restaurant" },
  { pattern: /\bbaker(y|ies)\b/i, label: "Bakeries", singular: "bakery" },
  { pattern: /\bcafe\b/i, label: "Cafes", singular: "cafe" },
  { pattern: /\bdental\b/i, label: "Dental practices", singular: "dental practice" },
  { pattern: /\bclinic\b/i, label: "Clinics", singular: "clinic" },
  { pattern: /\bmedical\b/i, label: "Medical practices", singular: "medical practice" },
  { pattern: /\bsalon\b/i, label: "Salons", singular: "salon" },
  { pattern: /\bspa\b/i, label: "Spas", singular: "spa" },
  { pattern: /\bbarber\b/i, label: "Barber shops", singular: "barber shop" },
  { pattern: /\bhvac\b/i, label: "HVAC companies", singular: "HVAC company" },
  { pattern: /\bplumb/i, label: "Plumbing companies", singular: "plumbing company" },
  { pattern: /\bcontractor\b/i, label: "Contractors", singular: "contractor" },
  { pattern: /\bgym\b/i, label: "Gyms", singular: "gym" },
  { pattern: /\bfitness\b/i, label: "Fitness studios", singular: "fitness studio" },
  { pattern: /\blawyer\b/i, label: "Law firms", singular: "law firm" },
  { pattern: /\breal estate\b/i, label: "Real estate agencies", singular: "real estate agency" }
];

function singularizeCategoryLabel(label: string) {
  const lower = label.trim().toLowerCase();
  if (lower.endsWith("ies")) {
    return `${lower.slice(0, -3)}y`;
  }

  if (lower.endsWith("ses") || lower.endsWith("xes") || lower.endsWith("zes")) {
    return lower.slice(0, -2);
  }

  if (lower.endsWith("s") && !lower.endsWith("ss")) {
    return lower.slice(0, -1);
  }

  return lower;
}

export function categoryLabelFromSearchValue(value: string | null | undefined): string | null {
  const normalized = safeTrim(value);
  if (!normalized) {
    return null;
  }

  return CATEGORY_LABEL_BY_VALUE.get(normalized as never) ?? null;
}

export function inferCategoryFromPitchAngle(pitchAngle: string) {
  const pitch = safeTrim(pitchAngle);
  if (!pitch) {
    return {
      business_category_label: "Local businesses",
      business_category_singular: "local business"
    };
  }

  for (const entry of PITCH_CATEGORY_PATTERNS) {
    if (entry.pattern.test(pitch)) {
      return {
        business_category_label: entry.label,
        business_category_singular: entry.singular
      };
    }
  }

  const cleaned = pitch.replace(/^pitch:\s*/i, "").trim();
  const shortLabel = cleaned.length > 42 ? `${cleaned.slice(0, 39).trim()}…` : cleaned;

  return {
    business_category_label: shortLabel,
    business_category_singular: singularizeCategoryLabel(shortLabel)
  };
}

export function categoryLabelFromPlaceTypes(types: string[] | null | undefined) {
  for (const type of types ?? []) {
    const label = CATEGORY_LABEL_BY_VALUE.get(type as never);
    if (label) {
      return {
        business_category_label: label,
        business_category_singular: singularizeCategoryLabel(label)
      };
    }
  }

  return null;
}

export function parsePublicAreaLabel(input: string | null | undefined) {
  const raw = safeTrim(input);
  if (!raw) {
    return "";
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const city = parts[parts.length - 3];
    const stateZip = parts[parts.length - 2] ?? "";
    const state = stateZip.match(/\b([A-Z]{2})\b/)?.[1];

    if (city && state) {
      return `${city}, ${state}`;
    }

    if (city) {
      return city;
    }
  }

  if (parts.length === 2) {
    const state = parts[1].match(/\b([A-Z]{2})\b/)?.[1];
    if (state) {
      return `${parts[0]}, ${state}`;
    }

    return parts[0];
  }

  return parts[0] ?? "";
}

function extractAreaFromHaystack(haystack: string) {
  const match = haystack.match(
    /\b(?:in|near|around|within)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})\b/
  );

  if (match?.[1]) {
    return match[1];
  }

  const cityState = haystack.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/);
  if (cityState?.[1] && cityState?.[2]) {
    return `${cityState[1]}, ${cityState[2]}`;
  }

  const nearCity = haystack.match(/\bnear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (nearCity?.[1]) {
    return nearCity[1];
  }

  return "";
}

export function buildAreaPhrase(areaLabel: string) {
  return areaLabel ? ` in ${areaLabel}` : " in this area";
}

export async function resolveEnrichmentPublicContext(input: {
  enrichment: CachedEnrichmentPayload;
  search_category?: string | null;
  area_label?: string | null;
  place_id?: string | null;
}): Promise<EnrichmentPublicContext> {
  let areaLabel = parsePublicAreaLabel(input.area_label);

  const categoryFromSearch = categoryLabelFromSearchValue(input.search_category);
  let categoryLabel: string | null = categoryFromSearch;
  let categorySingular: string | null = categoryFromSearch
    ? singularizeCategoryLabel(categoryFromSearch)
    : null;

  if (!areaLabel) {
    const haystack = [
      input.enrichment.opportunity_signal,
      input.enrichment.business_opportunity_summary,
      input.enrichment.recommended_pitch,
      input.enrichment.website_analysis
    ].join(" ");

    areaLabel = extractAreaFromHaystack(haystack);
  }

  if ((!categoryLabel || !areaLabel) && input.place_id) {
    try {
      const apiKey = getGooglePlacesKey();
      if (apiKey) {
        const detail = await placeDetails(input.place_id, apiKey);

        if (!areaLabel) {
          areaLabel =
            parsePublicAreaLabel(detail.formatted_address) ||
            parsePublicAreaLabel((detail as { vicinity?: string }).vicinity);
        }

        if (!categoryLabel) {
          const fromTypes = categoryLabelFromPlaceTypes(detail.types);
          if (fromTypes) {
            categoryLabel = fromTypes.business_category_label;
            categorySingular = fromTypes.business_category_singular;
          }
        }
      }
    } catch {
      // Best-effort only — fall back to pitch-angle inference.
    }
  }

  if (!categoryLabel || !categorySingular) {
    const inferred = inferCategoryFromPitchAngle(input.enrichment.pitch_angle);
    categoryLabel = categoryLabel ?? inferred.business_category_label;
    categorySingular = categorySingular ?? inferred.business_category_singular;
  }

  const finalArea = areaLabel || "this trade area";

  return {
    business_category_label: categoryLabel,
    business_category_singular: categorySingular,
    area_label: finalArea,
    area_phrase:
      finalArea === "this trade area" ? " in this trade area" : buildAreaPhrase(finalArea)
  };
}
