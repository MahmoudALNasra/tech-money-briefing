import type { Metadata } from "next";

import { ContentBriefGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Content Brief Generator",
  description: `Generate a practical SEO content brief with headings, FAQ ideas, search intent, and CTA prompts for free - from ${siteConfig.name}.`,
  keywords: [
    "content brief generator",
    "SEO brief generator",
    "blog outline generator",
    "content outline tool",
    "free SEO content tool"
  ],
  alternates: {
    canonical: absoluteUrl("/content-brief-generator")
  },
  robots: { index: true, follow: true }
};

export default function ContentBriefGeneratorPage() {
  return (
    <ToolPageShell
      toolHref="/content-brief-generator"
      eyebrow="Free SEO tool"
      title="Free content brief generator"
      description="Enter a keyword or topic and generate a simple content brief with search intent, H2 ideas, FAQ questions, and a call to action."
      secondaryCopy="Use this before writing articles, landing pages, or AI prompts so the piece has a clearer structure from the start."
    >
      <ContentBriefGenerator />
    </ToolPageShell>
  );
}
