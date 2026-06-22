import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComparisonView } from "@/components/compare/ComparisonView";
import { BackButton } from "@/components/navigation/BackButton";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import {
  getAllComparisonSlugs,
  getComparisonBySlug,
  getComparisonFaqItems,
  getComparisonMetadataDescription,
  getComparisonMetadataTitle
} from "@/lib/comparisons";
import { buildPageMetadata } from "@/lib/page-metadata";
import { absoluteUrl } from "@/lib/site";

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

  const imageUrl = absoluteUrl(`/generated/compare-${comparison.slug}.svg`);

  return buildPageMetadata({
    title: getComparisonMetadataTitle(comparison),
    description: getComparisonMetadataDescription(comparison),
    path: `/compare/${comparison.slug}`,
    keywords: comparison.keywords,
    image: {
      url: imageUrl,
      width: 1200,
      height: 630,
      alt: comparison.title
    }
  });
}

function comparisonFaqJsonLd(comparison: NonNullable<ReturnType<typeof getComparisonBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getComparisonFaqItems(comparison).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
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
      toolHref={`/compare/${comparison.slug}`}
      monetizationContext="compare"
      newsletterSource={`compare_${comparison.slug}`}
    >
      <div className="mb-6">
        <BackButton fallbackHref="/compare" label="Back to comparisons" />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(comparisonFaqJsonLd(comparison))
        }}
      />
      <ComparisonView comparison={comparison} />
    </ToolPageShell>
  );
}
