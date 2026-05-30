import type { Metadata } from "next";

import { AdvancedSeoTool } from "@/components/tools/AdvancedSeoTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "SERP Intent Analyzer",
  description: `Analyze live Google search results to understand search intent, page types, and content gaps - from ${siteConfig.name}.`,
  keywords: [
    "SERP intent analyzer",
    "search intent tool",
    "Google SERP analysis",
    "SEO content gap tool",
    "Serper SERP tool"
  ],
  robots: { index: true, follow: true }
};

export default function SerpIntentAnalyzerPage() {
  return (
    <ToolPageShell
      toolHref="/serp-intent-analyzer"
      eyebrow="Advanced SEO tool"
      title="SERP intent analyzer"
      description="Analyze live Google results for a keyword and get the dominant search intent, page types, content gaps, and outline ideas."
      secondaryCopy="Uses Serper.dev for live SERP data when SERPER_API_KEY is configured, then summarizes opportunities with AI."
    >
      <AdvancedSeoTool tool="serp-intent" defaultKeyword="best AI writing tools" />
    </ToolPageShell>
  );
}
