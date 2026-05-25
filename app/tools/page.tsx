import type { Metadata } from "next";
import Link from "next/link";

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

export default function ToolsPage() {
  return (
    <ToolPageShell
      eyebrow="Free tools"
      title="Free tools for creators, publishers, and marketers"
      description="Use these lightweight calculators, generators, and image tools to make content faster and estimate revenue more clearly."
      secondaryCopy="Each tool runs in your browser and has its own indexable page."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FREE_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400 hover:shadow-md"
          >
            <h2 className="text-lg font-black text-ink">{tool.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </ToolPageShell>
  );
}
