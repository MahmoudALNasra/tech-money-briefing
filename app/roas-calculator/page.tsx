import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { RoasCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free ROAS Calculator",
  description: `Calculate return on ad spend, cost per acquisition, and revenue per click for free - from ${siteConfig.name}.`,
  path: "/roas-calculator",
  keywords: ["ROAS calculator",
    "return on ad spend calculator",
    "ad spend calculator",
    "CPA calculator",
    "paid ads calculator"],
  robots: { index: true, follow: true }
});

export default function RoasCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free ads tool"
      title="Free ROAS calculator"
      description="Estimate return on ad spend, CPA, revenue after ad spend, and revenue per click from campaign numbers."
      secondaryCopy="Use it for quick paid search, Performance Max, social ads, and ecommerce planning."
    >
      <RoasCalculator />
    </ToolPageShell>
  );
}
