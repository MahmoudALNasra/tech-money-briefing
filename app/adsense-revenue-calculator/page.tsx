import type { Metadata } from "next";

import { AdsenseRevenueCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free AdSense Revenue Calculator",
  description: `Estimate AdSense revenue from pageviews, ad slots, viewability, CTR, and CPC with this free calculator - from ${siteConfig.name}.`,
  keywords: [
    "AdSense revenue calculator",
    "Google AdSense calculator",
    "website ad revenue calculator",
    "AdSense RPM calculator",
    "AdSense earnings estimator",
    "blog revenue calculator",
    "publisher revenue calculator"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function AdsenseRevenueCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free AdSense tool"
      title="Free AdSense revenue calculator"
      description="Estimate monthly AdSense revenue from pageviews, ad slots, viewability, click-through rate, and cost per click."
      secondaryCopy="This is a planning calculator, not a guarantee. Real AdSense earnings depend on traffic quality, geography, niche, policy compliance, and advertiser demand."
    >
      <AdsenseRevenueCalculator />
    </ToolPageShell>
  );
}
