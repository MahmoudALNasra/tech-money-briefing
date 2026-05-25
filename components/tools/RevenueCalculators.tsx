"use client";

import { useMemo, useState } from "react";

function numberFormat(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

function currencyFormat(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

export function CpmRpmCalculator() {
  const [pageviews, setPageviews] = useState(100000);
  const [rpm, setRpm] = useState(12);
  const [impressions, setImpressions] = useState(180000);
  const [cpm, setCpm] = useState(4);

  const results = useMemo(() => {
    const rpmRevenue = (pageviews / 1000) * rpm;
    const cpmRevenue = (impressions / 1000) * cpm;
    const combinedRevenue = rpmRevenue + cpmRevenue;

    return {
      rpmRevenue,
      cpmRevenue,
      combinedRevenue,
      effectiveRpm: pageviews > 0 ? (combinedRevenue / pageviews) * 1000 : 0
    };
  }, [cpm, impressions, pageviews, rpm]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberInput label="Monthly pageviews" value={pageviews} onChange={setPageviews} />
          <NumberInput label="Page RPM ($)" value={rpm} onChange={setRpm} step={0.5} />
          <NumberInput label="Ad impressions" value={impressions} onChange={setImpressions} />
          <NumberInput label="Ad CPM ($)" value={cpm} onChange={setCpm} step={0.25} />
        </div>
      </div>

      <ResultCard
        rows={[
          ["RPM revenue", currencyFormat(results.rpmRevenue)],
          ["CPM revenue", currencyFormat(results.cpmRevenue)],
          ["Total monthly revenue", currencyFormat(results.combinedRevenue)],
          ["Effective page RPM", currencyFormat(results.effectiveRpm)]
        ]}
      />
    </div>
  );
}

export function AdsenseRevenueCalculator() {
  const [pageviews, setPageviews] = useState(250000);
  const [pagesPerSession, setPagesPerSession] = useState(1.4);
  const [adSlots, setAdSlots] = useState(3);
  const [viewability, setViewability] = useState(65);
  const [ctr, setCtr] = useState(1.2);
  const [cpc, setCpc] = useState(0.28);

  const results = useMemo(() => {
    const sessions = pageviews / Math.max(0.1, pagesPerSession);
    const impressions = pageviews * adSlots * (viewability / 100);
    const clicks = impressions * (ctr / 100);
    const revenue = clicks * cpc;

    return {
      sessions,
      impressions,
      clicks,
      revenue,
      pageRpm: pageviews > 0 ? (revenue / pageviews) * 1000 : 0
    };
  }, [adSlots, cpc, ctr, pagesPerSession, pageviews, viewability]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberInput label="Monthly pageviews" value={pageviews} onChange={setPageviews} />
          <NumberInput label="Pages per session" value={pagesPerSession} onChange={setPagesPerSession} step={0.1} />
          <NumberInput label="Ad slots per page" value={adSlots} onChange={setAdSlots} step={1} />
          <NumberInput label="Viewability (%)" value={viewability} onChange={setViewability} step={1} />
          <NumberInput label="CTR (%)" value={ctr} onChange={setCtr} step={0.1} />
          <NumberInput label="CPC ($)" value={cpc} onChange={setCpc} step={0.01} />
        </div>
      </div>

      <ResultCard
        rows={[
          ["Estimated sessions", numberFormat(results.sessions)],
          ["Viewable ad impressions", numberFormat(results.impressions)],
          ["Estimated clicks", numberFormat(results.clicks)],
          ["Monthly AdSense revenue", currencyFormat(results.revenue)],
          ["Estimated page RPM", currencyFormat(results.pageRpm)]
        ]}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 1000
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="text-sm font-semibold text-stone-700">
      {label}
      <input
        type="number"
        value={value}
        min={0}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
      />
    </label>
  );
}

function ResultCard({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-ink p-6 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
        Estimate
      </p>
      <div className="mt-5 space-y-4">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-white/10 pb-3">
            <p className="text-sm text-stone-300">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-stone-300">
        Estimates are for planning only. Real earnings depend on niche, traffic
        geography, ad demand, layout, and policy compliance.
      </p>
    </div>
  );
}
