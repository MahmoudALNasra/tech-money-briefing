"use client";

import { MaskedRangeInput } from "@/components/business-data/MaskedRangeInput";
import {
  DEFAULT_RATING_FILTER_STATE,
  RATING_FILTER_MAX,
  RATING_PRESETS,
  type RatingFilterState
} from "@/lib/business-data-rating-filter";

type LeadsRatingFilterProps = {
  value: RatingFilterState;
  onChange: (value: RatingFilterState) => void;
};

export function LeadsRatingFilter({ value, onChange }: LeadsRatingFilterProps) {
  const selectValue =
    value.ratingMode === "custom"
      ? "custom"
      : value.ratingMode === "preset"
        ? value.ratingPreset
        : "";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-stone-800">
        Rating range
        <select
          value={selectValue}
          onChange={(event) => {
            const next = event.target.value;

            if (!next) {
              onChange({ ...DEFAULT_RATING_FILTER_STATE });
              return;
            }

            if (next === "custom") {
              onChange({
                ...value,
                ratingMode: "custom",
                ratingPreset: ""
              });
              return;
            }

            onChange({
              ratingMode: "preset",
              ratingPreset: next,
              ratingMin: value.ratingMin,
              ratingMax: value.ratingMax
            });
          }}
          className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950"
        >
          <option value="">Any rating</option>
          {RATING_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom range…</option>
        </select>
      </label>

      {value.ratingMode === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <MaskedRangeInput
            id="rating-min"
            label="From"
            mode="decimal"
            min={0}
            max={RATING_FILTER_MAX}
            step={0.1}
            value={value.ratingMin}
            onChange={(ratingMin) => onChange({ ...value, ratingMin })}
          />
          <MaskedRangeInput
            id="rating-max"
            label="To"
            mode="decimal"
            min={0}
            max={RATING_FILTER_MAX}
            step={0.1}
            value={value.ratingMax}
            onChange={(ratingMax) => onChange({ ...value, ratingMax })}
          />
        </div>
      ) : null}
    </div>
  );
}
