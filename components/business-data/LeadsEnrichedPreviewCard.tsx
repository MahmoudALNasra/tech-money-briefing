export type EnrichedPreviewRow = {
  place_id: string;
  name: string;
  website_analysis: string;
  business_opportunity_summary: string;
  recommended_pitch: string;
  pitch_angle: string;
  email_candidates?: string;
  opportunity_signal?: string;
  website_reachable?: boolean;
  gbp_profile_signal?: string;
  competitor_density_1mi?: number;
  active_social?: boolean;
};

type LeadsEnrichedPreviewCardProps = {
  row: EnrichedPreviewRow;
};

export function LeadsEnrichedPreviewCard({ row }: LeadsEnrichedPreviewCardProps) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Fully analyzed
          </p>
          <h3 className="mt-1 text-lg font-black text-ink">{row.name}</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
          {row.pitch_angle}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-stone-800">{row.opportunity_signal}</p>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700">
        {row.business_opportunity_summary}
      </p>
      <div className="mt-4 rounded-xl border border-white/80 bg-white p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
          Ready-to-send pitch
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-800">{row.recommended_pitch}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
        {row.email_candidates ? <span>Email: {row.email_candidates}</span> : null}
        {row.gbp_profile_signal ? <span>{row.gbp_profile_signal}</span> : null}
        {typeof row.competitor_density_1mi === "number" ? (
          <span>{row.competitor_density_1mi} similar businesses within 1 mi</span>
        ) : null}
        {row.active_social ? <span>Active social links found</span> : null}
      </div>
    </article>
  );
}
