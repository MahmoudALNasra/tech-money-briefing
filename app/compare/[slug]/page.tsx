import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComparisonView } from "@/components/compare/ComparisonView";
import { BackButton } from "@/components/navigation/BackButton";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { getAllComparisonSlugs, getComparisonBySlug } from "@/lib/comparisons";
import { absoluteUrl, siteConfig } from "@/lib/site";

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
  const url = absoluteUrl(`/compare/${comparison.slug}`);

  return {
    title: `${comparison.title} Comparison: Pricing, Features, and Best Fit`,
    description: `${comparison.description} - from ${siteConfig.name}.`,
    publisher: siteConfig.name,
    keywords: comparison.keywords,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url
    },
    openGraph: {
      title: `${comparison.title} Comparison: Pricing, Features, and Best Fit`,
      description: comparison.description,
      siteName: siteConfig.name,
      url,
      images: [{ url: imageUrl, alt: comparison.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${comparison.title} Comparison: Pricing, Features, and Best Fit`,
      description: comparison.description,
      images: [imageUrl]
    }
  };
}

function comparisonFaqJsonLd(comparison: NonNullable<ReturnType<typeof getComparisonBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${comparison.productA} better than ${comparison.productB}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${comparison.productA} is better for ${comparison.bestForA.join(", ")}. ${comparison.productB} is better for ${comparison.bestForB.join(", ")}.`
        }
      },
      {
        "@type": "Question",
        name: `What is the main difference between ${comparison.productA} and ${comparison.productB}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: comparison.summary
        }
      },
      {
        "@type": "Question",
        name: `Which keywords does this ${comparison.productA} vs ${comparison.productB} comparison cover?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: comparison.keywords.join(", ")
        }
      }
    ]
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
