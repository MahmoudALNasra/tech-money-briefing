import type { Metadata } from "next";

import { CpmRpmCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free CPM and RPM Calculator",
  description: `Calculate CPM revenue, RPM revenue, effective page RPM, and monthly publisher earnings for free - from ${siteConfig.name}.`,
  keywords: [
    "CPM calculator",
    "RPM calculator",
    "ad revenue calculator",
    "publisher revenue calculator",
    "page RPM calculator",
    "CPM to revenue",
    "website revenue calculator"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function CpmRpmCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free revenue calculator"
      title="Free CPM and RPM calculator"
      description="Estimate publisher revenue from pageviews, page RPM, ad impressions, and CPM. Useful for blogs, newsletters, and niche media sites."
      secondaryCopy="Change the inputs to model monthly ad revenue and your effective page RPM."
    >
      <CpmRpmCalculator />
    </ToolPageShell>
  );
}
