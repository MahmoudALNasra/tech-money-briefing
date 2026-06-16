import { LeadsRatingFilter } from "@/components/business-data/LeadsRatingFilter";
import { LeadsReviewCountFilter } from "@/components/business-data/LeadsReviewCountFilter";
import {
  DEFAULT_RATING_FILTER_STATE,
  normalizeRatingFilterState,
  type RatingFilterState
} from "@/lib/business-data-rating-filter";
import {
  DEFAULT_REVIEW_FILTER_STATE,
  normalizeReviewFilterState,
  type ReviewFilterState
} from "@/lib/business-data-review-filter";
import type { WebsiteFilter } from "@/lib/business-data-search-filters";

export type AdvancedFilterState = {
  ratingMode: RatingFilterState["ratingMode"];
  ratingPreset: string;
  ratingMin: number;
  ratingMax: number;
  reviewMode: ReviewFilterState["reviewMode"];
  reviewPreset: string;
  reviewMin: number;
  reviewMax: number;
  openNowOnly: boolean;
  websiteFilter: WebsiteFilter;
  excludeInput: string;
};

export const DEFAULT_ADVANCED_FILTER_STATE: AdvancedFilterState = {
  ...DEFAULT_RATING_FILTER_STATE,
  ...DEFAULT_REVIEW_FILTER_STATE,
  openNowOnly: false,
  websiteFilter: "any",
  excludeInput: ""
};

export function normalizeAdvancedFilterState(
  value: Partial<AdvancedFilterState> & {
    minRating?: number | "";
    minReviewCount?: number | "";
  }
): AdvancedFilterState {
  const rating = normalizeRatingFilterState(value);
  const review = normalizeReviewFilterState(value);

  return {
    ...rating,
    ...review,
    openNowOnly: Boolean(value.openNowOnly),
    websiteFilter:
      value.websiteFilter === "has" || value.websiteFilter === "none"
        ? value.websiteFilter
        : "any",
    excludeInput: typeof value.excludeInput === "string" ? value.excludeInput : ""
  };
}

type LeadsAdvancedFiltersProps = {
  value: AdvancedFilterState;
  onChange: (value: AdvancedFilterState) => void;
  excludedCount?: number;
};

export function LeadsAdvancedFilters({
  value,
  onChange,
  excludedCount
}: LeadsAdvancedFiltersProps) {
  return (
    <details className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
      <summary className="cursor-pointer text-sm font-black text-ink">
        Advanced filters <span className="font-semibold text-stone-500">(instant, free)</span>
      </summary>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <LeadsRatingFilter
            value={{
              ratingMode: value.ratingMode,
              ratingPreset: value.ratingPreset,
              ratingMin: value.ratingMin,
              ratingMax: value.ratingMax
            }}
            onChange={(rating) => onChange({ ...value, ...rating })}
          />
        </div>
        <div className="md:col-span-2">
          <LeadsReviewCountFilter
            value={{
              reviewMode: value.reviewMode,
              reviewPreset: value.reviewPreset,
              reviewMin: value.reviewMin,
              reviewMax: value.reviewMax
            }}
            onChange={(review) => onChange({ ...value, ...review })}
          />
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-800 md:col-span-2">
          <input
            type="checkbox"
            checked={value.openNowOnly}
            onChange={(event) => onChange({ ...value, openNowOnly: event.target.checked })}
          />
          Open now only
        </label>
        <label className="block text-sm font-semibold text-stone-800 md:col-span-2">
          Website available
          <select
            value={value.websiteFilter}
            onChange={(event) =>
              onChange({
                ...value,
                websiteFilter: event.target.value as WebsiteFilter
              })
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950"
          >
            <option value="any">Any</option>
            <option value="has">Website available</option>
            <option value="none">No website</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-stone-800 md:col-span-2">
          Exclude businesses (comma-separated place IDs or names)
          <textarea
            value={value.excludeInput}
            onChange={(event) => onChange({ ...value, excludeInput: event.target.value })}
            rows={3}
            placeholder="place_id_abc, Competitor Name, another-place-id"
            className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400"
          />
        </label>
      </div>
      {typeof excludedCount === "number" && excludedCount > 0 ? (
        <p className="mt-3 text-xs font-semibold text-emerald-800">
          Excluded {excludedCount} businesses from this run based on your filters.
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Permanently closed businesses are excluded automatically. These filters run before
        enrichment and do not spend credits.
      </p>
    </details>
  );
}

export function parseExcludeInput(input: string) {
  const parts = input
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const excludePlaceIds: string[] = [];
  const excludeNames: string[] = [];

  for (const part of parts) {
    if (/^ChIJ[\w-]+$/i.test(part) || part.includes("demo-") || part.length > 20) {
      excludePlaceIds.push(part);
    } else {
      excludeNames.push(part);
    }
  }

  return { excludePlaceIds, excludeNames };
}
