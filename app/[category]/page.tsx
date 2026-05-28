import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { FeedWithSidebar } from "@/components/layout/FeedWithSidebar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPaginatedArticlesByCategory } from "@/lib/articles";
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
  const page = parsePageParam((await searchParams)?.page);
  const paginatedArticles = isCoreCategory(normalizedCategory)
    ? await getPaginatedArticlesByCategory(normalizedCategory, page)
    : null;

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
        categories={[...CORE_CATEGORIES]}
        activeCategory={normalizedCategory}
      />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Category Briefing
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              {categoryLabel}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              {categoryDescription}
            </p>
          </div>
        </section>
        {articles.length > 0 ? (
          <FeedWithSidebar activeCategory={normalizedCategory}>
            <ArticleFeed articles={articles} />
            {paginatedArticles ? (
              <PaginationControls
                currentPage={paginatedArticles.page}
                totalPages={paginatedArticles.totalPages}
                basePath={`/${normalizedCategory}`}
                hasPreviousPage={paginatedArticles.hasPreviousPage}
                hasNextPage={paginatedArticles.hasNextPage}
              />
            ) : null}
          </FeedWithSidebar>
        ) : (
          <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
              <h2 className="text-2xl font-bold text-ink">
                No {categoryLabel} articles yet
              </h2>
              <p className="mt-3 text-stone-600">
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
