import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { NewsletterRevenueCalculator } from "@/components/tools/RevenueCalculators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Newsletter Revenue Calculator",
  description: `Estimate newsletter revenue from subscribers, opens, clicks, and conversions for free - from ${siteConfig.name}.`,
  path: "/newsletter-revenue-calculator",
  keywords: ["newsletter revenue calculator",
    "email revenue estimator",
    "creator newsletter calculator"],
  robots: { index: true, follow: true }
});

export default function NewsletterRevenueCalculatorPage() {
  return (
    <ToolPageShell
      eyebrow="Free newsletter tool"
      title="Free newsletter revenue calculator"
      description="Estimate newsletter revenue from list size, open rate, click rate, conversion rate, and offer price."
      secondaryCopy="This is a planning calculator. Real newsletter revenue depends on offer quality, list health, and repeat purchases."
    >
      <NewsletterRevenueCalculator />
    </ToolPageShell>
  );
}
