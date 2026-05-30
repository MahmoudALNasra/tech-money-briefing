import type { Metadata } from "next";

import { CacPaybackCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free CAC Payback Calculator",
  description: `Estimate CAC payback period, gross LTV, and LTV:CAC for SaaS and subscription businesses for free - from ${siteConfig.name}.`,
  keywords: [
    "CAC payback calculator",
    "customer acquisition cost calculator",
    "LTV CAC calculator",
    "SaaS payback calculator",
    "startup metrics calculator"
  ],
  robots: { index: true, follow: true }
};

export default function CacPaybackCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free startup tool"
      title="Free CAC payback calculator"
      description="Estimate how many months it takes to recover customer acquisition cost from gross profit per customer."
      secondaryCopy="Useful for SaaS, subscription products, agencies, and paid acquisition planning."
    >
      <CacPaybackCalculator />
    </ToolPageShell>
  );
}
