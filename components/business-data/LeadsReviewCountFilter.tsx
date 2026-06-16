"use client";

import { MaskedRangeInput } from "@/components/business-data/MaskedRangeInput";
import {
  DEFAULT_REVIEW_FILTER_STATE,
  REVIEW_FILTER_MAX,
  REVIEW_PRESETS,
  type ReviewFilterState
} from "@/lib/business-data-review-filter";

type LeadsReviewCountFilterProps = {
  value: ReviewFilterState;
  onChange: (value: ReviewFilterState) => void;
};

export function LeadsReviewCountFilter({ value, onChange }: LeadsReviewCountFilterProps) {
  const selectValue =
    value.reviewMode === "custom"
      ? "custom"
      : value.reviewMode === "preset"
        ? value.reviewPreset
        : "";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-stone-800">
        Reviews count
        <select
          value={selectValue}
          onChange={(event) => {
            const next = event.target.value;

            if (!next) {
              onChange({ ...DEFAULT_REVIEW_FILTER_STATE, reviewMode: "any" });
              return;
            }

            if (next === "custom") {
              onChange({
                ...value,
                reviewMode: "custom",
                reviewPreset: ""
              });
              return;
            }

            onChange({
              reviewMode: "preset",
              reviewPreset: next,
              reviewMin: value.reviewMin,
              reviewMax: value.reviewMax
            });
          }}
          className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950"
        >
          <option value="">Any review count</option>
          {REVIEW_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom range…</option>
        </select>
      </label>

      {value.reviewMode === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <MaskedRangeInput
            id="review-min"
            label="From"
            mode="integer"
            min={0}
            max={REVIEW_FILTER_MAX}
            step={1}
            value={value.reviewMin}
            onChange={(reviewMin) => onChange({ ...value, reviewMin })}
          />
          <MaskedRangeInput
            id="review-max"
            label="To"
            mode="integer"
            min={0}
            max={REVIEW_FILTER_MAX}
            step={1}
            value={value.reviewMax}
            onChange={(reviewMax) => onChange({ ...value, reviewMax })}
          />
        </div>
      ) : null}
    </div>
  );
}
