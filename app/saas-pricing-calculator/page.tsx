import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { SaasPricingCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free SaaS Pricing Calculator",
  description: `Estimate MRR, ARR, LTV, and LTV:CAC from price, churn, and customer count for free - from ${siteConfig.name}.`,
  path: "/saas-pricing-calculator",
  keywords: ["SaaS pricing calculator",
    "MRR calculator",
    "LTV calculator",
    "startup revenue calculator"],
  robots: { index: true, follow: true }
});

export default function SaasPricingCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free SaaS tool"
      title="Free SaaS pricing calculator"
      description="Estimate MRR, ARR, customer lifetime value, and LTV:CAC from pricing, churn, and acquisition cost."
      secondaryCopy="Use this for quick planning. Real SaaS economics also depend on expansion revenue, support costs, and payback time."
    >
      <SaasPricingCalculator />
    </ToolPageShell>
  );
}
