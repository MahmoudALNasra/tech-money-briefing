type LeadsSearchOrientationProps = {
  freeRunEnrichedCount?: number;
};

/**
 * Results render in the section below this form on the same page (scroll down after search).
 */
export function LeadsSearchOrientation({
  freeRunEnrichedCount = 3
}: LeadsSearchOrientationProps) {
  return (
    <div className="mb-5 space-y-3">
      <p className="text-sm leading-6 text-stone-700">
        Enter a location below — your first {freeRunEnrichedCount} matches come back fully analyzed
        on this page. Scroll down after you search to see pitches, opportunity signals, and
        outreach notes inline.
      </p>
      <div
        aria-hidden="true"
        className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400"
      >
        <span className="text-stone-500">↓</span>
        <span>Business</span>
        <span className="text-stone-300">·</span>
        <span>Pitch angle</span>
        <span className="text-stone-300">·</span>
        <span>Opportunity signal</span>
      </div>
    </div>
  );
}
