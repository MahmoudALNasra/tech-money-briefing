export const RATING_FILTER_MAX = 5;
export const RATING_FILTER_STEP = 0.1;
export const RATING_FILTER_MAX_TENTHS = 50;

export type RatingFilterMode = "any" | "preset" | "custom";

export type RatingPreset = {
  id: string;
  label: string;
  min: number;
  max: number;
};

export const RATING_PRESETS: RatingPreset[] = Array.from({ length: 10 }, (_, index) => {
  const min = Number((index * 0.5).toFixed(1));
  const max = Number((min + 0.5).toFixed(1));

  return {
    id: `${min}-${max}`,
    label: `${min.toFixed(1)} – ${max.toFixed(1)}`,
    min,
    max
  };
});

export type RatingFilterState = {
  ratingMode: RatingFilterMode;
  ratingPreset: string;
  ratingMin: number;
  ratingMax: number;
};

export const DEFAULT_RATING_FILTER_STATE: RatingFilterState = {
  ratingMode: "any",
  ratingPreset: "",
  ratingMin: 0,
  ratingMax: RATING_FILTER_MAX
};

export function clampRatingTenths(tenths: number) {
  return Math.min(RATING_FILTER_MAX_TENTHS, Math.max(0, Math.round(tenths)));
}

export function ratingToTenths(value: number) {
  return clampRatingTenths(Math.round(value * 10));
}

export function tenthsToRating(tenths: number) {
  return clampRatingTenths(tenths) / 10;
}

export function formatRatingTenths(tenths: number) {
  return tenthsToRating(tenths).toFixed(1);
}

/** Digit-entry field: "23" → 2.3 (stored as tenths 23). */
export function parseRatingDigitInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) {
    return 0;
  }

  return clampRatingTenths(Number.parseInt(digits, 10));
}

export function resolveRatingFilterRange(
  state: RatingFilterState
): { minRating?: number; maxRating?: number } {
  if (state.ratingMode === "any") {
    return {};
  }

  if (state.ratingMode === "preset" && state.ratingPreset) {
    const preset = RATING_PRESETS.find((item) => item.id === state.ratingPreset);
    if (!preset) {
      return {};
    }

    return { minRating: preset.min, maxRating: preset.max };
  }

  if (state.ratingMode === "custom") {
    const min = Math.min(state.ratingMin, state.ratingMax);
    const max = Math.max(state.ratingMin, state.ratingMax);
    return { minRating: min, maxRating: max };
  }

  return {};
}

export function normalizeRatingFilterState(
  value: Partial<RatingFilterState> & { minRating?: number | "" }
): RatingFilterState {
  if (
    value.ratingMode === "any" ||
    value.ratingMode === "preset" ||
    value.ratingMode === "custom"
  ) {
    return {
      ratingMode: value.ratingMode,
      ratingPreset: value.ratingPreset ?? "",
      ratingMin: tenthsToRating(ratingToTenths(value.ratingMin ?? 0)),
      ratingMax: tenthsToRating(ratingToTenths(value.ratingMax ?? RATING_FILTER_MAX))
    };
  }

  if (typeof value.minRating === "number" && value.minRating > 0) {
    return {
      ratingMode: "custom",
      ratingPreset: "",
      ratingMin: value.minRating,
      ratingMax: RATING_FILTER_MAX
    };
  }

  return { ...DEFAULT_RATING_FILTER_STATE };
}
