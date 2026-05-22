import type { Metadata } from "next";

import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getArticlesByCategory } from "@/lib/articles";
import { CORE_CATEGORIES, isCoreCategory } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { normalizeCategory } from "@/lib/slug";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export const revalidate = 900;

export async function generateMetadata({
  params
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const normalizedCategory = normalizeCategory(category);
  const label = formatCategory(normalizedCategory);
  const title = `${label} Briefings`;
  const description = `Latest ${label} analysis from ${siteConfig.name}.`;
  const url = absoluteUrl(`/${normalizedCategory}`);

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
      type: "website"
    }
  };
}

export async function generateStaticParams() {
  return CORE_CATEGORIES.map((category) => ({ category }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const normalizedCategory = normalizeCategory(category);
  const articles = isCoreCategory(normalizedCategory)
    ? await getArticlesByCategory(normalizedCategory, 64)
    : [];

  const categoryLabel = formatCategory(normalizedCategory);

  return (
    <>
      <SiteHeader
        categories={[...CORE_CATEGORIES]}
        activeCategory={normalizedCategory}
      />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Category Briefing
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              {categoryLabel}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Curated analyst summaries for {categoryLabel} professionals.
            </p>
          </div>
        </section>
        {articles.length > 0 ? (
          <ArticleFeed articles={articles} />
        ) : (
          <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
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
