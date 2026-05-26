import type { Metadata } from "next";

import { ToolCard } from "@/components/tools/ToolCard";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { FREE_TOOLS } from "@/lib/free-tools";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Tools for Creators, Publishers, and Marketers",
  description: `Free online tools from ${siteConfig.name}: meme generator, image compressor, thumbnail maker, AdSense calculator, CPM calculator, headline generator, and more.`,
  keywords: [
    "free online tools",
    "free meme generator",
    "AdSense calculator",
    "CPM calculator",
    "image compressor",
    "thumbnail maker",
    "headline generator"
  ],
  robots: {
    index: true,
    follow: true
  }
};

const featuredToolHrefs = [
  "/ai-headline-generator",
  "/adsense-revenue-calculator"
];

const toolSections = [
  {
    title: "Content and social generators",
    description: "Turn a trend into headlines, hooks, subject lines, social images, and shareable posts.",
    hrefs: [
      "/ai-headline-generator",
      "/blog-title-generator",
      "/youtube-title-generator",
      "/tiktok-hook-generator",
      "/newsletter-subject-line-generator",
      "/meme-generator",
      "/youtube-thumbnail-maker",
      "/x-card-generator"
    ]
  },
  {
    title: "Revenue calculators",
    description: "Estimate creator, publisher, newsletter, ad, and SaaS revenue before making a bigger bet.",
    hrefs: [
      "/adsense-revenue-calculator",
      "/adsense-ctr-calculator",
      "/cpm-rpm-calculator",
      "/newsletter-revenue-calculator",
      "/saas-pricing-calculator"
    ]
  },
  {
    title: "SEO and marketing utilities",
    description: "Clean up metadata, campaign links, images, robots.txt files, and early brand ideas.",
    hrefs: [
      "/meta-description-generator",
      "/utm-builder",
      "/robots-txt-generator",
      "/image-compressor",
      "/startup-name-generator"
    ]
  }
];

function getToolsByHref(hrefs: string[]) {
  return hrefs
    .map((href) => FREE_TOOLS.find((tool) => tool.href === href))
    .filter((tool): tool is (typeof FREE_TOOLS)[number] => Boolean(tool));
}

export default function ToolsPage() {
  const featuredTools = getToolsByHref(featuredToolHrefs);

  return (
    <ToolPageShell
      eyebrow="Free tools"
      title="Free tools for creators, publishers, and marketers"
      description="Use these lightweight calculators, generators, and image tools to make content faster and estimate revenue more clearly."
      secondaryCopy="Each tool runs in your browser and has its own indexable page."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          [String(FREE_TOOLS.length), "free tools"],
          ["3", "traffic workflows"],
          ["0", "login required"]
        ].map(([value, label]) => (
          <div key={label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-3xl font-black text-ink">{value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {featuredTools.map((tool) => (
          <ToolCard key={tool.href} tool={tool} featured />
        ))}
      </div>

      <div className="mt-10 space-y-10">
        {toolSections.map((section) => {
          const tools = getToolsByHref(section.hrefs);

          return (
            <section key={section.title}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-ink">
                    {section.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    {section.description}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
                  {tools.length} tools
                </span>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard key={tool.href} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </ToolPageShell>
  );
}
