import type { Metadata } from "next";
import Link from "next/link";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { COMPARISONS } from "@/lib/comparisons";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Software Comparisons for Publishers and Operators",
  description: `Side-by-side comparisons of newsletters, SEO tools, ecommerce platforms, AI apps, and ad stacks from ${siteConfig.name}.`,
  keywords: [
    "software comparisons",
    "newsletter platform comparison",
    "SEO tool comparison",
    "SaaS comparison guides"
  ],
  robots: { index: true, follow: true }
};

export default function CompareHubPage() {
  const featuredComparisons = COMPARISONS.slice(0, 3);
  const remainingComparisons = COMPARISONS.slice(3);

  return (
    <ToolPageShell
      eyebrow="Comparisons"
      title="Software comparisons for publishers and operators"
      description="Decision guides for newsletter platforms, SEO stacks, ecommerce tools, AI apps, and monetization products."
      secondaryCopy="Each comparison includes a decision table, best-for guidance, and links to relevant free tools."
      monetizationContext="compare"
      newsletterSource="compare_hub"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {featuredComparisons.map((comparison, index) => (
          <Link
            key={comparison.slug}
            href={`/compare/${comparison.slug}`}
            className="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-stone-400 hover:shadow-xl"
          >
            <ComparisonThumbnail comparison={comparison} index={index} />
            <div className="p-5">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-stone-500">
                Featured
              </span>
              <h2 className="mt-4 text-xl font-black text-ink">
                {comparison.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {comparison.description}
              </p>
              <span className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-ink">
                Read comparison
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              More matchups
            </p>
            <h2 className="mt-2 text-2xl font-black text-ink">
              Browse all comparisons
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
            {COMPARISONS.length} guides
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {remainingComparisons.map((comparison, index) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:border-stone-400 hover:shadow-md sm:grid-cols-[150px_1fr]"
            >
              <ComparisonThumbnail
                comparison={comparison}
                index={index + 3}
                compact
              />
              <div className="p-5">
                <h3 className="text-lg font-black text-ink">
                  {comparison.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {comparison.description}
                </p>
                <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-ink">
                  View guide
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ToolPageShell>
  );
}

function ComparisonThumbnail({
  comparison,
  index,
  compact = false
}: {
  comparison: (typeof COMPARISONS)[number];
  index: number;
  compact?: boolean;
}) {
  const gradients = [
    "from-indigo-600 via-sky-500 to-emerald-400",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-violet-600 via-fuchsia-500 to-cyan-500",
    "from-stone-800 via-slate-600 to-blue-500"
  ];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${
        gradients[index % gradients.length]
      } ${compact ? "min-h-40 sm:min-h-full" : "h-52"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.16)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.16)_50%,rgba(255,255,255,0.16)_75%,transparent_75%,transparent)] bg-[length:100%_100%,28px_28px]" />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.18em] text-white">
        <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
          Compare
        </span>
        <span className="rounded-full bg-black/20 px-3 py-1 backdrop-blur">
          Guide
        </span>
      </div>
      <div className="absolute inset-x-4 bottom-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <ProductBadge name={comparison.productA} />
        <div className="rounded-full bg-white px-3 py-2 text-sm font-black text-ink shadow-lg">
          VS
        </div>
        <ProductBadge name={comparison.productB} />
      </div>
    </div>
  );
}

function ProductBadge({ name }: { name: string }) {
  return (
    <div className="rounded-2xl bg-white/22 p-3 text-center text-sm font-black leading-tight text-white shadow-lg backdrop-blur">
      {name}
    </div>
  );
}
