import type { EnrichedPreviewRow } from "@/components/business-data/LeadsEnrichedPreviewCard";
import { applyReportFilters, type ReportGenerationFilters } from "@/lib/business-data-search-filters";

type LeadsFilteredSelectionProps = {
  rows: EnrichedPreviewRow[];
  filters: ReportGenerationFilters;
  selectedPlaceIds: string[];
  onTogglePlaceId: (placeId: string) => void;
  onSelectAllFiltered: () => void;
};

export function LeadsFilteredSelection({
  rows,
  filters,
  selectedPlaceIds,
  onTogglePlaceId,
  onSelectAllFiltered
}: LeadsFilteredSelectionProps) {
  const filtered = applyReportFilters(
    rows.map((row) => ({
      place_id: row.place_id,
      pitch_angle: row.pitch_angle,
      email_candidates: row.email_candidates,
      website_reachable: row.website_reachable
    })),
    filters
  );

  const filteredRows = rows.filter((row) =>
    filtered.some((item) => item.place_id === row.place_id)
  );

  if (filteredRows.length === 0) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No Sample Enrich rows match your Tier 2 filters. Loosen filters or run Sample Enrich on a
        wider search.
      </p>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-ink">
          Select leads for your final report ({filteredRows.length} match filters)
        </p>
        <button
          type="button"
          onClick={onSelectAllFiltered}
          className="text-xs font-bold text-emerald-700 underline"
        >
          Select all filtered
        </button>
      </div>
      <ul className="mt-3 max-h-72 space-y-2 overflow-auto">
        {filteredRows.map((row) => (
          <li
            key={row.place_id}
            className="flex items-start gap-3 rounded-xl border border-stone-200 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selectedPlaceIds.includes(row.place_id)}
              onChange={() => onTogglePlaceId(row.place_id)}
              className="mt-1"
            />
            <div>
              <p className="font-bold text-ink">{row.name}</p>
              <p className="text-xs text-stone-600">{row.pitch_angle}</p>
              <p className="mt-1 text-xs text-stone-500">{row.opportunity_signal}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Final report uses only your selection. Businesses already enriched in Sample Enrich are not
        charged again.
      </p>
    </div>
  );
}
