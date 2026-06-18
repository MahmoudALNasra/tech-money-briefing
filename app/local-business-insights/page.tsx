import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { InsightsCitationBlock } from "@/components/insights/InsightsCitationBlock";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import {
  buildCitationBlock,
  getLocalBusinessInsightsSnapshot
} from "@/lib/local-business-insights";
import { buildPageMetadata } from "@/lib/page-metadata";
import { localBusinessInsightsDatasetJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Local Business Insights — Aggregated SMB Signals",
  description: `Anonymized local business statistics from ${siteConfig.name}'s enrichment cache: website reachability, email discovery, social presence, and competitor density.`,
  path: "/local-business-insights",
  keywords: [
    "local business statistics",
    "small business website stats",
    "local SEO data",
    "SMB digital presence"
  ]
});

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function LocalBusinessInsightsPage() {
  const snapshot = await getLocalBusinessInsightsSnapshot();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessInsightsDatasetJsonLd(snapshot))
        }}
      />
      <SiteHeader categories={[...getPublicNavCategories()]} />
      <main className="min-h-screen bg-[var(--bg-base)]">
        <section className="page-hero-band">
          <div className="page-hero-inner max-w-4xl">
            <p className="page-eyebrow">Citable data</p>
            <h1 className="page-h1">State of local business digital presence</h1>
            <p className="page-sub">
              Aggregated, anonymized signals from businesses analyzed through the{" "}
              <Link href="/leads" className="font-semibold text-[var(--accent-blue)] underline">
                local lead generator
              </Link>
              . Built for journalists, marketers, and operators who need a number they can cite.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
          {!snapshot.ready ? (
            <div className="rounded-[1.75rem] border border-amber-200/40 bg-amber-50/10 p-8 text-stone-200">
              <h2 className="text-xl font-black text-white">Not enough aggregate data yet</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                This page needs at least {snapshot.minimumSample} enriched businesses before
                publishing headline statistics. Current anonymized cache sample:{" "}
                <strong className="text-white">{snapshot.sampleSize}</strong>.
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                Publishing thin numbers would undermine the point of a citable asset. Once the
                enrichment cache crosses the threshold, the stats below will appear automatically.
              </p>
              <Link
                href="/leads"
                className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-black text-ink transition hover:bg-stone-100"
              >
                Run the lead generator
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  Sample: {snapshot.sampleSize} businesses
                </p>
                <p className="text-xs text-[var(--text-dim)]">
                  Updated {new Date(snapshot.generatedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {snapshot.stats.map((stat) => (
                  <article
                    key={stat.id}
                    className="rounded-[1.5rem] border border-white/10 bg-[var(--bg-surface)] p-6 shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-4xl font-black text-white">{stat.value}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                      {stat.detail}
                    </p>
                    <InsightsCitationBlock
                      citation={buildCitationBlock(snapshot, stat)}
                    />
                  </article>
                ))}
              </div>
            </>
          )}

          {snapshot.topCategories.length > 0 ? (
            <section className="mt-10 rounded-[1.5rem] border border-white/10 bg-[var(--bg-surface)] p-6">
              <h2 className="text-lg font-black text-white">Most searched categories (recent)</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Category search volume only — not tied to individual businesses.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {snapshot.topCategories.map((item) => (
                  <li
                    key={item.category}
                    className="flex items-center justify-between border-b border-white/5 pb-2"
                  >
                    <span className="font-semibold capitalize">{item.category.replace(/_/g, " ")}</span>
                    <span className="font-mono text-xs text-[var(--text-dim)]">
                      {item.searches} searches
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10 rounded-[1.5rem] border border-dashed border-white/10 p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--text-dim)]">
              Methodology
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              {snapshot.methodology}
            </p>
          </section>
        </section>
      </main>
    </>
  );
}
