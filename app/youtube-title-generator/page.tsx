import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { YoutubeTitleGenerator } from "@/components/tools/ExtendedGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free YouTube Title Generator",
  description: `Generate clickable YouTube title ideas from a topic or keyword for free - from ${siteConfig.name}.`,
  path: "/youtube-title-generator",
  keywords: ["YouTube title generator",
    "free YouTube title ideas",
    "video title generator"],
  robots: { index: true, follow: true }
});

export default function YoutubeTitleGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free YouTube tool"
      title="Free YouTube title generator"
      description="Enter a video topic and generate YouTube title ideas for tech, business, and creator channels."
      secondaryCopy="Use the results as first drafts, then tighten them with your hook, audience, and thumbnail angle."
    >
      <YoutubeTitleGenerator />
    </ToolPageShell>
  );
}
