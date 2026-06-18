import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { BlogTitleGenerator } from "@/components/tools/ExtendedGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Free Blog Title Generator",
  description: `Generate SEO-friendly blog post title ideas for publishers and founders for free - from ${siteConfig.name}.`,
  path: "/blog-title-generator",
  keywords: ["blog title generator",
    "SEO blog title ideas",
    "article title generator",
    "content title generator"],
  robots: { index: true, follow: true }
});

export default function BlogTitleGeneratorPage() {
  return (
    <ToolPageShell
      toolHref="/blog-title-generator"
      eyebrow="Free blog tool"
      title="Free blog title generator"
      description="Enter a topic and generate blog title ideas optimized for search intent and publisher traffic."
      secondaryCopy="Pick the title that best matches the query you want to win, then make the article deliver on that promise."
    >
      <BlogTitleGenerator />
    </ToolPageShell>
  );
}
