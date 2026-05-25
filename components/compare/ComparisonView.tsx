import Link from "next/link";

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
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-7 text-stone-700">{comparison.summary}</p>
      </section>

      <section>
        <h2 className="text-2xl font-black text-ink">Quick decision table</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200">
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

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Best for {comparison.productA}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">
            {comparison.bestForA.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Best for {comparison.productB}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">
            {comparison.bestForB.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-black text-ink">Monetization angle</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700">
          {comparison.monetizationAngle}
        </p>
      </section>

      {relatedTools.length > 0 ? (
        <section>
          <h2 className="text-2xl font-black text-ink">Related free tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400"
              >
                <p className="font-bold text-ink">{tool.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <p className="text-sm leading-7 text-stone-700">
          Explore more side-by-side guides on the{" "}
          <Link href="/compare" className="font-semibold text-ink underline">
            comparisons hub
          </Link>{" "}
          or browse{" "}
          <Link href="/tools" className="font-semibold text-ink underline">
            free tools
          </Link>{" "}
          for calculators and generators.
        </p>
      </section>
    </div>
  );
}
