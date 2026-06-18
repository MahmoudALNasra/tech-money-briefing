import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { RobotsTxtGenerator } from "@/components/tools/ExtendedGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Robots.txt Generator",
  description: `Generate a simple robots.txt file with crawl rules and sitemap URL for free - from ${siteConfig.name}.`,
  path: "/robots-txt-generator",
  keywords: ["robots.txt generator",
    "free robots.txt tool",
    "SEO robots file generator"],
  robots: { index: true, follow: true }
});

export default function RobotsTxtGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free SEO tool"
      title="Free robots.txt generator"
      description="Generate a simple robots.txt file with crawl directives and your sitemap URL."
      secondaryCopy="Review staging and production rules before publishing. Complex sites may need more than a one-line allow rule."
    >
      <RobotsTxtGenerator />
    </ToolPageShell>
  );
}
