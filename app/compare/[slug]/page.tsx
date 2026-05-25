import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComparisonView } from "@/components/compare/ComparisonView";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { getAllComparisonSlugs, getComparisonBySlug } from "@/lib/comparisons";
import { siteConfig } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    return { title: "Comparison not found" };
  }

  return {
    title: `${comparison.title} Comparison`,
    description: `${comparison.description} - from ${siteConfig.name}.`,
    keywords: comparison.keywords,
    robots: { index: true, follow: true }
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    notFound();
  }

  return (
    <ToolPageShell
      eyebrow="Comparison"
      title={comparison.title}
      description={comparison.description}
      secondaryCopy={`${comparison.productA} vs ${comparison.productB} for operators who care about revenue, workflow, and distribution.`}
    >
      <ComparisonView comparison={comparison} />
    </ToolPageShell>
  );
}
