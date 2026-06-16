import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { SiteHeader } from "@/components/layout/SiteHeader";
import BlurText from "@/components/ui/BlurText";
import { getPaginatedArticlesByCategory } from "@/lib/articles";
import {
  getPublicNavCategories,
  isAdsenseHiddenCategory
} from "@/lib/adsense-readiness";
import {
  CATEGORY_SEO_DESCRIPTIONS,
  CORE_CATEGORIES,
  isCoreCategory
} from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { paginatedCanonicalPath, parsePageParam } from "@/lib/pagination";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { normalizeCategory } from "@/lib/slug";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
  searchParams
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const normalizedCategory = normalizeCategory(category);

  if (!isCoreCategory(normalizedCategory)) {
    return {
      title: "Not Found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const page = parsePageParam((await searchParams)?.page);
  const label = formatCategory(normalizedCategory);
  const title =
    page > 1 ? `${label} Briefings - Page ${page}` : `${label} Briefings`;
  const description = isCoreCategory(normalizedCategory)
    ? CATEGORY_SEO_DESCRIPTIONS[normalizedCategory]
    : `Latest ${label} analysis from ${siteConfig.name}.`;
  const canonicalPath = paginatedCanonicalPath(`/${normalizedCategory}`, page);
  const url = absoluteUrl(canonicalPath);
  const image = absoluteUrl("/og-default-v3.png");

  return {
    title,
    description,
    robots: isAdsenseHiddenCategory(normalizedCategory)
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export async function generateStaticParams() {
  return CORE_CATEGORIES.map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
  searchParams
}: CategoryPageProps) {
  const { category } = await params;
  const normalizedCategory = normalizeCategory(category);

  if (!isCoreCategory(normalizedCategory)) {
    notFound();
  }

  const page = parsePageParam((await searchParams)?.page);
  const paginatedArticles = await getPaginatedArticlesByCategory(
    normalizedCategory,
    page
  );

  if (
    paginatedArticles &&
    paginatedArticles.totalCount > 0 &&
    page > paginatedArticles.totalPages
  ) {
    redirect(
      paginatedArticles.totalPages > 1
        ? `/${normalizedCategory}?page=${paginatedArticles.totalPages}`
        : `/${normalizedCategory}`
    );
  }

  const articles = paginatedArticles?.articles ?? [];

  const categoryLabel = formatCategory(normalizedCategory);
  const categoryDescription = isCoreCategory(normalizedCategory)
    ? CATEGORY_SEO_DESCRIPTIONS[normalizedCategory]
    : `Curated analyst summaries for ${categoryLabel} professionals.`;

  return (
    <>
      <SiteHeader
        categories={getPublicNavCategories()}
        activeCategory={normalizedCategory}
      />
      <main className="min-h-screen bg-[var(--bg-base)] pb-16">
        <section className="page-hero-band">
          <div className="page-hero-inner">
            <p className="page-eyebrow">{categoryLabel}</p>
            <h1 className="page-h1">
              <BlurText
                text={`Latest briefings on ${categoryLabel.toLowerCase()} for operators.`}
                delay={60}
                animateBy="words"
                direction="top"
                threshold={0.3}
                className="blur-headline-word"
              />
            </h1>
            <p className="page-sub">
              {categoryDescription}
            </p>
          </div>
        </section>
        {articles.length > 0 ? (
          <section className="py-12" aria-labelledby="category-articles-heading">
            <h2 id="category-articles-heading" className="sr-only">
              Latest {categoryLabel} articles
            </h2>
            <ArticleFeed articles={articles} variant="grid" />
            {paginatedArticles ? (
              <div className="mx-auto max-w-[1140px] px-10">
                <PaginationControls
                  currentPage={paginatedArticles.page}
                  totalPages={paginatedArticles.totalPages}
                  basePath={`/${normalizedCategory}`}
                  hasPreviousPage={paginatedArticles.hasPreviousPage}
                  hasNextPage={paginatedArticles.hasNextPage}
                />
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="rounded-md border border-dashed border-white/10 bg-[var(--bg-surface)] p-10 text-center">
              <h2 className="text-2xl font-bold text-white">
                No {categoryLabel} articles yet
              </h2>
              <p className="mt-3 text-slate-400">
                Add a matching RSS source or run ingestion again after new feed
                items are published.
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
