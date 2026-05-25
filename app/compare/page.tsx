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
  return (
    <ToolPageShell
      eyebrow="Comparisons"
      title="Software comparisons for publishers and operators"
      description="Decision guides for newsletter platforms, SEO stacks, ecommerce tools, AI apps, and monetization products."
      secondaryCopy="Each comparison includes a decision table, best-for guidance, and links to relevant free tools."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {COMPARISONS.map((comparison) => (
          <Link
            key={comparison.slug}
            href={`/compare/${comparison.slug}`}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400 hover:shadow-md"
          >
            <h2 className="text-lg font-black text-ink">{comparison.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {comparison.description}
            </p>
            <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              Read comparison
            </span>
          </Link>
        ))}
      </div>
    </ToolPageShell>
  );
}
