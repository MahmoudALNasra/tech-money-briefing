import type { Metadata } from "next";

import { AiHeadlineGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free AI Headline Generator",
  description: `Generate headline ideas for blog posts, articles, newsletters, social posts, and tech content for free - from ${siteConfig.name}.`,
  keywords: [
    "AI headline generator",
    "free headline generator",
    "blog headline generator",
    "article title generator",
    "social headline generator",
    "newsletter headline ideas"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function AiHeadlineGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free writing tool"
      title="Free AI headline generator"
      description="Enter a topic and generate headline ideas for blog posts, newsletters, social posts, and tech briefings."
      secondaryCopy="Use the results as first drafts, then make them more specific with your own numbers, audience, and angle."
    >
      <AiHeadlineGenerator />
    </ToolPageShell>
  );
}
