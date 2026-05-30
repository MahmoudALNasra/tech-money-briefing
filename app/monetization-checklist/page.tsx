import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";
import { SponsoredPlacement } from "@/components/monetization/SponsoredPlacement";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CORE_CATEGORIES } from "@/lib/categories";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publisher Monetization Checklist (AdSense, Affiliates, Newsletter)",
  description: `A practical checklist for AdSense approval, affiliate pages, newsletter capture, sponsorships, and tool-led SEO—from ${siteConfig.name}.`,
  keywords: [
    "publisher monetization checklist",
    "AdSense approval checklist",
    "affiliate site checklist",
    "newsletter monetization"
  ],
  robots: { index: true, follow: true }
};

const checklistSections = [
  {
    title: "Traffic and trust basics",
    items: [
      "Original articles with clear sourcing and editorial policy linked in the footer",
      "About and contact pages that match the domain brand",
      "Privacy policy covers ads, analytics, and email capture",
      "Site loads on mobile without layout shift on ad slots",
      "Internal links to tools, comparisons, and category hubs"
    ]
  },
  {
    title: "Display ads (AdSense and beyond)",
    items: [
      "ads.txt served at /ads.txt with your publisher ID",
      "Enough indexed pages in a coherent niche (not thin doorway pages)",
      "Ad slots below the fold first; avoid crowding above-the-fold on mobile",
      "Model RPM with pageviews, CTR, and CPC before expecting network upgrades",
      "Plan a path to sponsorships so ads are not your only lever"
    ]
  },
  {
    title: "Affiliate and referral revenue",
    items: [
      "Dedicated referral-link guides for tools you actually recommend",
      "Comparison pages for high-intent software decisions",
      "UTM tags on outbound campaigns so referrals are measurable",
      "Disclosure on affiliate and sponsored placements",
      "Match offers to reader intent (hosting for devs, CRM for SMBs, etc.)"
    ]
  },
  {
    title: "Newsletter and owned audience",
    items: [
      "Capture on articles, tools, and comparison pages—not only the homepage",
      "One clear promise (weekly tools, SEO signals, revenue briefings)",
      "Welcome path that points to your best tools and comparisons",
      "Sponsorship inventory defined before you need a sales deck",
      "Estimate revenue with list size, opens, and sponsor CPM assumptions"
    ]
  },
  {
    title: "SEO assets that earn revenue",
    items: [
      "Free calculators and generators with indexable landing pages",
      "Content briefs and meta tools that turn research into pages",
      "Keyword cluster and SERP intent workflows for editorial planning",
      "Robots.txt and sitemap hygiene for crawl budget",
      "Search Console review for quick-win queries you already rank for"
    ]
  }
];

export default function MonetizationChecklistPage() {
  return (
    <>
      <SiteHeader categories={[...CORE_CATEGORIES]} />
      <main className="bg-stone-50 pt-[73px]">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Lead magnet
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Publisher monetization checklist
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              A problem-first checklist for founders and publishers: fix what blocks
              revenue before adding more tactics.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl space-y-8 px-5 py-10 sm:px-8">
          {checklistSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-2xl font-black text-ink">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-black text-ink">Want a second pair of eyes?</h2>
            <p className="mt-3 text-sm leading-7 text-stone-700">
              Submit your URL for a free{" "}
              <Link href="/monetization-audit" className="font-semibold text-ink underline">
                monetization audit
              </Link>
              . We focus on gaps you can fix this month—not vanity metrics.
            </p>
          </div>

          <NewsletterCapture
            placementIndex={91}
            source="monetization_checklist"
            variant="compact"
            eyebrow="Weekly briefing"
            title="Get AI, SEO, and revenue tool signals."
            description="One email with practical tests for publishers and operators—no hype funnels."
          />

          <SponsoredPlacement context="tool" placementIndex={92} />

          <p className="text-sm text-stone-500">
            Related:{" "}
            <Link href="/tools" className="font-semibold text-ink underline">
              free tools
            </Link>
            ,{" "}
            <Link href="/compare" className="font-semibold text-ink underline">
              comparisons
            </Link>
            ,{" "}
            <Link href="/advertise" className="font-semibold text-ink underline">
              advertise
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
