import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolsHub } from "@/components/tools/ToolsHub";
import { buildPageMetadata } from "@/lib/page-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Tools for Creators, Publishers, and Marketers",
  description: `Free online tools from ${siteConfig.name}: SEO analyzers, content generators, AdSense calculator, CPM calculator, headline generator, and more.`,
  path: "/tools",
  keywords: [
    "free online tools",
    "SEO tools",
    "keyword cluster tool",
    "SERP intent analyzer",
    "AdSense calculator",
    "content brief generator"
  ]
});

const featuredToolHrefs = [
  "/keyword-cluster-tool",
  "/serp-intent-analyzer",
  "/content-gap-finder",
  "/adsense-revenue-calculator",
  "/content-brief-generator",
  "/ai-headline-generator"
];

export default function ToolsPage() {
  return (
    <ToolPageShell
      eyebrow="Free tools"
      title="Free tools for creators, publishers, and marketers"
      description="Use calculators, SEO analyzers, and generators to plan content, estimate revenue, and ship indexable assets faster."
      secondaryCopy="Pick a workflow below or filter by category. Each tool has its own SEO page with guides, FAQs, and related tools."
      showMonetizationRail={true}
      showAssistant={false}
      newsletterSource="tools_hub"
      animateHeroTitle
    >
      <ToolsHub featuredToolHrefs={featuredToolHrefs} />
    </ToolPageShell>
  );
}
