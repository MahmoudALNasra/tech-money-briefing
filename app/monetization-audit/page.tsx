import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";

import { MonetizationAuditForm } from "@/components/monetization/MonetizationAuditForm";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Monetization Audit for Publishers and Operators",
  description: `Submit your site for a practical monetization audit—ads, affiliates, newsletter, and sponsorship gaps—from ${siteConfig.name}.`,
  path: "/monetization-audit",
  keywords: ["monetization audit",
    "publisher revenue audit",
    "AdSense audit",
    "affiliate site review"],
  robots: { index: true, follow: true }
});

export default function MonetizationAuditPage() {
  return (
    <ToolPageShell
      eyebrow="Monetization audit"
      title="Free monetization audit for your site"
      description="Tell us your URL, goal, and what is stuck. We reply with specific gaps—not generic growth advice."
      secondaryCopy="Built for founders, publishers, and marketers who want revenue paths that match real traffic and intent."
      newsletterSource="monetization_audit_page"
      showMonetizationRail={false}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <MonetizationAuditForm source="monetization_audit_page" />

        <aside className="space-y-5">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              What we check
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
              <li>Ad readiness (policy risk, layout, RPM levers)</li>
              <li>Affiliate and referral fit for your niche</li>
              <li>Newsletter capture and list monetization paths</li>
              <li>Tool and comparison pages you are missing</li>
              <li>Sponsorship surfaces that match buyer intent</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm leading-7 text-stone-700">
              Prefer a checklist first? Use the{" "}
              <Link href="/monetization-checklist" className="font-semibold text-ink underline">
                monetization checklist
              </Link>{" "}
              or browse{" "}
              <Link href="/compare" className="font-semibold text-ink underline">
                software comparisons
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </ToolPageShell>
  );
}
