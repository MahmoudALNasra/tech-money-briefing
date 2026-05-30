import Link from "next/link";

import { ToolCard } from "@/components/tools/ToolCard";
import type { ComparisonPage } from "@/lib/comparisons";
import { FREE_TOOLS } from "@/lib/free-tools";

type ComparisonViewProps = {
  comparison: ComparisonPage;
};

export function ComparisonView({ comparison }: ComparisonViewProps) {
  const relatedTools = FREE_TOOLS.filter((tool) =>
    comparison.relatedToolHrefs.includes(tool.href)
  );

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-[1fr_auto_1fr]">
          <ProductPanel
            name={comparison.productA}
            label="Option A"
            items={comparison.bestForA}
            accent="from-indigo-600 to-sky-500"
          />
          <div className="flex items-center justify-center border-y border-stone-200 bg-stone-950 px-6 py-5 text-center text-2xl font-black uppercase tracking-[0.22em] text-white md:border-x md:border-y-0">
            VS
          </div>
          <ProductPanel
            name={comparison.productB}
            label="Option B"
            items={comparison.bestForB}
            accent="from-amber-500 to-rose-500"
          />
        </div>
        <div className="border-t border-stone-200 bg-stone-50 p-6">
          <p className="text-base leading-8 text-stone-700">
            {comparison.summary}
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              Decision map
            </p>
            <h2 className="mt-2 text-2xl font-black text-ink">
              Quick decision table
            </h2>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            {comparison.decisionRows.length} factors
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {comparison.decisionRows.map((row, index) => (
            <DecisionCard
              key={row.label}
              row={row}
              productA={comparison.productA}
              productB={comparison.productB}
              index={index}
            />
          ))}
        </div>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-4 py-3">Factor</th>
                <th className="px-4 py-3">{comparison.productA}</th>
                <th className="px-4 py-3">{comparison.productB}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.decisionRows.map((row) => (
                <tr key={row.label} className="border-t border-stone-200">
                  <th className="px-4 py-3 font-semibold text-ink">{row.label}</th>
                  <td className="px-4 py-3 text-stone-700">{row.left}</td>
                  <td className="px-4 py-3 text-stone-700">{row.right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-amber-200/60 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
            Revenue lens
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Monetization angle
          </h2>
        </div>
        <p className="mt-3 text-sm leading-7 text-stone-700">
          {comparison.monetizationAngle}
        </p>
      </section>

      {relatedTools.length > 0 ? (
        <section>
          <h2 className="text-2xl font-black text-ink">Related free tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedTools.map((tool) => (
              <ToolCard key={tool.href} tool={tool} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <p className="text-sm leading-7 text-stone-700">
          Explore more side-by-side guides on the{" "}
          <Link href="/compare" className="font-semibold text-ink underline">
            comparisons hub
          </Link>
          , browse{" "}
          <Link href="/tools" className="font-semibold text-ink underline">
            free tools
          </Link>
          , or request a{" "}
          <Link href="/monetization-audit" className="font-semibold text-ink underline">
            free monetization audit
          </Link>{" "}
          for your site.
        </p>
      </section>
    </div>
  );
}

function ProductPanel({
  name,
  label,
  items,
  accent
}: {
  name: string;
  label: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className={`relative min-h-72 overflow-hidden bg-gradient-to-br ${accent} p-6 text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.16)_50%,rgba(255,255,255,0.16)_75%,transparent_75%,transparent)] bg-[length:100%_100%,30px_30px]" />
      <div className="relative">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] backdrop-blur">
          {label}
        </span>
        <h2 className="mt-6 text-4xl font-black tracking-tight">{name}</h2>
        <div className="mt-6 space-y-3">
          {items.slice(0, 3).map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white/18 p-3 text-sm font-semibold leading-6 shadow-sm backdrop-blur"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({
  row,
  productA,
  productB,
  index
}: {
  row: ComparisonPage["decisionRows"][number];
  productA: string;
  productB: string;
  index: number;
}) {
  const widths = [88, 72, 62, 80];
  const leftWidth = widths[index % widths.length];
  const rightWidth = widths[(index + 2) % widths.length];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-black text-ink">{row.label}</h3>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
          Compare
        </span>
      </div>
      <div className="mt-5 space-y-4">
        <VisualBar label={productA} value={row.left} width={leftWidth} color="bg-indigo-500" />
        <VisualBar label={productB} value={row.right} width={rightWidth} color="bg-amber-500" />
      </div>
    </div>
  );
}

function VisualBar({
  label,
  value,
  width,
  color
}: {
  label: string;
  value: string;
  width: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
        <span>{label}</span>
        <span className="normal-case tracking-normal text-stone-600">{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
