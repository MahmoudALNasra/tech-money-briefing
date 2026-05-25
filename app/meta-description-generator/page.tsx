import type { Metadata } from "next";

import { MetaDescriptionGenerator } from "@/components/tools/ExtendedGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Meta Description Generator",
  description: `Draft meta description ideas for articles, tools, and landing pages for free - from ${siteConfig.name}.`,
  keywords: [
    "meta description generator",
    "SEO meta description tool",
    "free meta description writer"
  ],
  robots: { index: true, follow: true }
};

export default function MetaDescriptionGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free SEO tool"
      title="Free meta description generator"
      description="Enter a page topic and generate meta description drafts for articles, tools, and landing pages."
      secondaryCopy="Keep descriptions specific, under roughly 155 characters, and aligned with the page's actual promise."
    >
      <MetaDescriptionGenerator />
    </ToolPageShell>
  );
}
