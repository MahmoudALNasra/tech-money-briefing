import { SAMPLE_ENRICH_SIZE_PUBLIC } from "@/lib/business-data-free-config";
import { formatCreditBalance } from "@/lib/format-token-balance";

type LeadsSampleEnrichPanelProps = {
  sampleSize?: number;
  creditBalance: number | null;
  isLoading: boolean;
  onRunSampleEnrich: () => void;
};

export function LeadsSampleEnrichPanel({
  sampleSize = SAMPLE_ENRICH_SIZE_PUBLIC,
  creditBalance,
  isLoading,
  onRunSampleEnrich
}: LeadsSampleEnrichPanelProps) {
  const affordable = (creditBalance ?? 0) >= 1;

  return (
    <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">
        Step 2 — Sample Enrich
      </p>
      <h3 className="mt-2 text-lg font-black text-ink">
        Enrich a sample of {sampleSize} to unlock smart filtering
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        Spend up to {formatCreditBalance(sampleSize)} credits to enrich the first {sampleSize}{" "}
        matches from this search. Then filter by pitch angle, email availability, and website
        status — and generate your final report only for the leads you select.
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        1 credit per business, same as full reports. Cache hits still debit normally.
      </p>
      <button
        type="button"
        onClick={onRunSampleEnrich}
        disabled={isLoading || !affordable}
        className="mt-4 rounded-full bg-sky-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {isLoading
          ? "Enriching sample..."
          : `Run Sample Enrich (up to ${formatCreditBalance(sampleSize)} credits)`}
      </button>
      {!affordable ? (
        <p className="mt-2 text-xs font-semibold text-amber-800">
          Buy credits above to unlock Sample Enrich and Tier 2 filters.
        </p>
      ) : null}
    </div>
  );
}
