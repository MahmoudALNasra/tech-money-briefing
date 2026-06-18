import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { AdvancedSeoTool } from "@/components/tools/AdvancedSeoTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Keyword Cluster Tool",
  description: `Cluster SEO keywords by search intent using OpenAI and Google autocomplete suggestions - from ${siteConfig.name}.`,
  path: "/keyword-cluster-tool",
  keywords: ["keyword cluster tool",
    "SEO keyword clustering",
    "keyword research tool",
    "keyword clustering tool",
    "search intent clustering"],
  robots: { index: true, follow: true }
});

export default function KeywordClusterToolPage() {
  return (
    <ToolPageShell
      toolHref="/keyword-cluster-tool"
      eyebrow="Advanced SEO tool"
      title="Keyword cluster tool"
      description="Enter a topic and generate intent-based keyword clusters, quick wins, and page recommendations using AI and Google autocomplete suggestions."
      secondaryCopy="Best for planning article hubs, landing pages, comparison pages, and FAQ sections before writing."
    >
      <AdvancedSeoTool tool="keyword-cluster" defaultKeyword="AI tools for market research" />
    </ToolPageShell>
  );
}
