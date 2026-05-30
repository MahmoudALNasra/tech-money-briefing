import type { Metadata } from "next";

import { AdvancedSeoTool } from "@/components/tools/AdvancedSeoTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Content Gap Finder",
  description: `Compare your page against competitor URLs and find SEO content gaps, FAQ gaps, and priority edits - from ${siteConfig.name}.`,
  keywords: [
    "content gap finder",
    "SEO content gap tool",
    "competitor content analysis",
    "page comparison SEO tool",
    "content audit tool"
  ],
  robots: { index: true, follow: true }
};

export default function ContentGapFinderPage() {
  return (
    <ToolPageShell
      toolHref="/content-gap-finder"
      eyebrow="Advanced SEO tool"
      title="Content gap finder"
      description="Compare your page with competitor URLs and find missing sections, weak areas, FAQ gaps, and priority SEO edits."
      secondaryCopy="This tool fetches page text and uses AI to recommend usefulness-focused improvements, not just longer content."
    >
      <AdvancedSeoTool tool="content-gap" defaultKeyword="newsletter monetization" />
    </ToolPageShell>
  );
}
