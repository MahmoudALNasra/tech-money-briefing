import type { EnrichedPreviewRow } from "@/components/business-data/LeadsEnrichedPreviewCard";

export type ReportFilterState = {
  pitchAngles: string[];
  hasEmailCandidate: "any" | "yes" | "no";
  websiteReachable: "any" | "yes" | "no";
};

type LeadsReportFiltersProps = {
  value: ReportFilterState;
  onChange: (value: ReportFilterState) => void;
  enrichedPreview: EnrichedPreviewRow[];
  availablePitchAngles: string[];
  unlocked: boolean;
  isFreeUser: boolean;
};

export function LeadsReportFilters({
  value,
  onChange,
  enrichedPreview,
  availablePitchAngles,
  unlocked,
  isFreeUser
}: LeadsReportFiltersProps) {
  const pitchOptions =
    availablePitchAngles.length > 0
      ? availablePitchAngles
      : Array.from(
          new Set(enrichedPreview.map((row) => row.pitch_angle).filter(Boolean))
        );

  const lockMessage = isFreeUser
    ? "Run Sample Enrich (paid) to filter by pitch angle, email availability, and website status."
    : "Run Sample Enrich on this search to unlock Tier 2 filters.";

  return (
    <div
      className={`rounded-3xl border p-4 ${
        unlocked
          ? "border-sky-100 bg-sky-50/70"
          : "border-stone-200 bg-stone-50/80"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">
        Tier 2 filters {!unlocked ? <span className="text-stone-500">(locked)</span> : null}
      </p>
      {!unlocked ? (
        <p className="mt-2 text-sm font-semibold text-stone-700">{lockMessage}</p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-stone-700">
          Filter your Sample Enrich results, then choose which leads go into the final Excel report.
        </p>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <fieldset className="md:col-span-1">
          <legend className="text-sm font-semibold text-stone-800">Pitch angle</legend>
          <div className="mt-2 space-y-2">
            {pitchOptions.map((angle) => (
              <label key={angle} className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  disabled={!unlocked}
                  checked={value.pitchAngles.includes(angle)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...value.pitchAngles, angle]
                      : value.pitchAngles.filter((item) => item !== angle);
                    onChange({ ...value, pitchAngles: next });
                  }}
                />
                {angle}
              </label>
            ))}
            {!pitchOptions.length ? (
              <p className="text-xs text-stone-500">Pitch angles appear after Sample Enrich.</p>
            ) : null}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold text-stone-800">
          Has email candidate
          <select
            disabled={!unlocked}
            title={unlocked ? undefined : lockMessage}
            value={value.hasEmailCandidate}
            onChange={(event) =>
              onChange({
                ...value,
                hasEmailCandidate: event.target.value as ReportFilterState["hasEmailCandidate"]
              })
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-stone-100"
          >
            <option value="any">Any</option>
            <option value="yes">Has email</option>
            <option value="no">No email</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-stone-800">
          Website reachable
          <select
            disabled={!unlocked}
            title={unlocked ? undefined : lockMessage}
            value={value.websiteReachable}
            onChange={(event) =>
              onChange({
                ...value,
                websiteReachable: event.target.value as ReportFilterState["websiteReachable"]
              })
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-stone-100"
          >
            <option value="any">Any</option>
            <option value="yes">Reachable</option>
            <option value="no">Not reachable / no site</option>
          </select>
        </label>
      </div>
    </div>
  );
}
