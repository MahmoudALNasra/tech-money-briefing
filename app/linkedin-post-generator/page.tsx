import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { LinkedinPostGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata = buildPageMetadata({
  title: "Free LinkedIn Post Generator for Founders & B2B Marketers",
  description:
    "Generate LinkedIn post drafts for founders, creators, and B2B marketers. Free LinkedIn post ideas and social copy starting points.",
  path: "/linkedin-post-generator",
  keywords: [
    "LinkedIn post generator",
    "free LinkedIn post generator",
    "LinkedIn content ideas",
    "founder LinkedIn posts",
    "B2B social post generator"
  ],
  robots: { index: true, follow: true }
});

export default function LinkedinPostGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free social tool"
      title="Free LinkedIn post generator"
      description="Enter a topic and generate practical LinkedIn post drafts for founders, marketers, creators, and business operators."
      secondaryCopy="Use these as starting points. Add your own example, metric, or lesson before publishing."
      toolHref="/linkedin-post-generator"
    >
      <LinkedinPostGenerator />
    </ToolPageShell>
  );
}
