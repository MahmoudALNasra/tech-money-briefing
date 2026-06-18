import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { NewsletterSubjectGenerator } from "@/components/tools/TextGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Newsletter Subject Line Generator",
  description: `Generate newsletter subject line ideas for tech, business, SaaS, AI, and creator newsletters for free - from ${siteConfig.name}.`,
  path: "/newsletter-subject-line-generator",
  keywords: ["newsletter subject line generator",
    "free subject line generator",
    "email subject line ideas",
    "newsletter ideas",
    "AI newsletter subject lines",
    "email headline generator"],
  robots: {
    index: true,
    follow: true
  }
});

export default function NewsletterSubjectLineGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free newsletter tool"
      title="Free newsletter subject line generator"
      description="Enter a topic and generate subject line ideas for newsletters about tech, business, AI, startups, and media."
      secondaryCopy="Click a subject line to copy it, then edit the angle to match your audience."
    >
      <NewsletterSubjectGenerator />
    </ToolPageShell>
  );
}
