import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { StartupNameGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Startup Name Generator",
  description: `Generate startup name ideas for SaaS, AI tools, newsletters, apps, and side projects for free - from ${siteConfig.name}.`,
  path: "/startup-name-generator",
  keywords: ["startup name generator",
    "free business name generator",
    "SaaS name generator",
    "AI startup name generator",
    "app name generator",
    "company name ideas"],
  robots: {
    index: true,
    follow: true
  }
});

export default function StartupNameGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free naming tool"
      title="Free startup name generator"
      description="Enter an idea or keyword and generate short startup names for SaaS products, AI apps, newsletters, and side projects."
      secondaryCopy="Click any result to copy it and keep generating until something feels usable."
    >
      <StartupNameGenerator />
    </ToolPageShell>
  );
}
