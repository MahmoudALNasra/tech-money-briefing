import type { Metadata } from "next";

import { AdsenseCtrCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free AdSense CTR Calculator",
  description: `Calculate CTR, RPM, and estimated revenue from impressions and clicks for free - from ${siteConfig.name}.`,
  keywords: [
    "AdSense CTR calculator",
    "website CTR calculator",
    "publisher CTR tool"
  ],
  robots: { index: true, follow: true }
};

export default function AdsenseCtrCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free AdSense tool"
      title="Free AdSense CTR calculator"
      description="Calculate click-through rate, RPM, and estimated AdSense revenue from impressions and clicks."
      secondaryCopy="CTR alone does not define earnings. Traffic quality, ad layout, geography, and niche all move real RPM."
    >
      <AdsenseCtrCalculator />
    </ToolPageShell>
  );
}
