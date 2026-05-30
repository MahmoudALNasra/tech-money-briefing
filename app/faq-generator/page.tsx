import type { Metadata } from "next";

import { FaqGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free FAQ Generator",
  description: `Generate FAQ questions for articles, tools, product pages, and SEO content for free - from ${siteConfig.name}.`,
  keywords: [
    "FAQ generator",
    "free FAQ generator",
    "FAQ question generator",
    "SEO FAQ tool",
    "content FAQ ideas"
  ],
  robots: { index: true, follow: true }
};

export default function FaqGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free SEO tool"
      title="Free FAQ generator"
      description="Enter a topic, keyword, or product and generate useful FAQ questions for articles, landing pages, and help content."
      secondaryCopy="FAQ sections can help readers scan faster and can make your content more complete when the answers are specific and honest."
    >
      <FaqGenerator />
    </ToolPageShell>
  );
}
