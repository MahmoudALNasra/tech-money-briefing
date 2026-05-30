import type { Metadata } from "next";

import { LinkedinPostGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free LinkedIn Post Generator",
  description: `Generate LinkedIn post drafts for founders, creators, marketers, and operators for free - from ${siteConfig.name}.`,
  keywords: [
    "LinkedIn post generator",
    "free LinkedIn post generator",
    "LinkedIn content ideas",
    "founder LinkedIn posts",
    "B2B social post generator"
  ],
  robots: { index: true, follow: true }
};

export default function LinkedinPostGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free social tool"
      title="Free LinkedIn post generator"
      description="Enter a topic and generate practical LinkedIn post drafts for founders, marketers, creators, and business operators."
      secondaryCopy="Use these as starting points. Add your own example, metric, or lesson before publishing."
    >
      <LinkedinPostGenerator />
    </ToolPageShell>
  );
}
