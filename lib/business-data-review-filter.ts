export const REVIEW_FILTER_MAX = 9999;
export const DEFAULT_REVIEW_RANGE_MAX = 1000;

export type ReviewFilterMode = "any" | "preset" | "custom";

export type ReviewPreset = {
  id: string;
  label: string;
  min: number;
  max: number;
};

/** 1–10, 11–20, … 91–100 (non-overlapping decade buckets). */
export const REVIEW_PRESETS: ReviewPreset[] = Array.from({ length: 10 }, (_, index) => {
  const min = index === 0 ? 1 : index * 10 + 1;
  const max = (index + 1) * 10;

  return {
    id: `${min}-${max}`,
    label: `${min} – ${max}`,
    min,
    max
  };
});

export type ReviewFilterState = {
  reviewMode: ReviewFilterMode;
  reviewPreset: string;
  reviewMin: number;
  reviewMax: number;
};

export const DEFAULT_REVIEW_FILTER_STATE: ReviewFilterState = {
  reviewMode: "any",
  reviewPreset: "",
  reviewMin: 1,
  reviewMax: DEFAULT_REVIEW_RANGE_MAX
};

export function clampReviewCount(value: number) {
  return Math.min(REVIEW_FILTER_MAX, Math.max(0, Math.round(value)));
}

export function parseReviewDigitInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (!digits) {
    return 0;
  }

  return clampReviewCount(Number.parseInt(digits, 10));
}

export function reviewCountToDigits(value: number) {
  const clamped = clampReviewCount(value);
  if (clamped === 0) {
    return "";
  }

  return String(clamped);
}

export function resolveReviewFilterRange(
  state: ReviewFilterState
): { minReviewCount?: number; maxReviewCount?: number } {
  if (state.reviewMode === "any") {
    return {};
  }

  if (state.reviewMode === "preset" && state.reviewPreset) {
    const preset = REVIEW_PRESETS.find((item) => item.id === state.reviewPreset);
    if (!preset) {
      return {};
    }

    return { minReviewCount: preset.min, maxReviewCount: preset.max };
  }

  if (state.reviewMode === "custom") {
    const min = Math.min(state.reviewMin, state.reviewMax);
    const max = Math.max(state.reviewMin, state.reviewMax);
    return { minReviewCount: min, maxReviewCount: max };
  }

  return {};
}

export function normalizeReviewFilterState(
  value: Partial<ReviewFilterState> & { minReviewCount?: number | "" }
): ReviewFilterState {
  if (
    value.reviewMode === "any" ||
    value.reviewMode === "preset" ||
    value.reviewMode === "custom"
  ) {
    return {
      reviewMode: value.reviewMode,
      reviewPreset: value.reviewPreset ?? "",
      reviewMin: clampReviewCount(value.reviewMin ?? 1),
      reviewMax: clampReviewCount(value.reviewMax ?? DEFAULT_REVIEW_RANGE_MAX)
    };
  }

  if (typeof value.minReviewCount === "number" && value.minReviewCount > 0) {
    return {
      reviewMode: "custom",
      reviewPreset: "",
      reviewMin: value.minReviewCount,
      reviewMax: REVIEW_FILTER_MAX
    };
  }

  return { ...DEFAULT_REVIEW_FILTER_STATE };
}
