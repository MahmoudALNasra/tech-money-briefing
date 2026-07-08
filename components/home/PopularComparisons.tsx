import Link from "next/link";

import { getComparisonsInPriorityOrder } from "@/lib/comparisons";
import { TOP_COMPARE_SLUGS_BY_GSC } from "@/lib/traffic-priorities";

export function PopularComparisons() {
  const comparisons = getComparisonsInPriorityOrder(TOP_COMPARE_SLUGS_BY_GSC).slice(
    0,
    6
  );

  return (
    <section
      className="border-y border-white/[0.06] bg-[var(--bg-surface)] py-14"
      aria-labelledby="popular-comparisons-heading"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-dim)]">
              High-intent guides
            </p>
            <h2
              id="popular-comparisons-heading"
              className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)]"
            >
              Popular software comparisons
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Side-by-side guides for the searches driving the most visibility
              right now — hosting, analytics, data warehouses, newsletters, and
              more.
            </p>
          </div>
          <Link
            href="/compare"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-secondary)] transition hover:border-white/20 hover:text-[var(--text-primary)]"
          >
            All comparisons
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {comparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">
                {comparison.productA} vs {comparison.productB}
              </p>
              <h3 className="mt-3 text-lg font-black text-[var(--text-primary)]">
                {comparison.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
                {comparison.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
