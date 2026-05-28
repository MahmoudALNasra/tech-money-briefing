import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { FeedWithSidebar } from "@/components/layout/FeedWithSidebar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPaginatedPublishedArticles } from "@/lib/articles";
import { CORE_CATEGORIES } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { paginatedCanonicalPath, parsePageParam } from "@/lib/pagination";
import { absoluteUrl, siteConfig } from "@/lib/site";

type HomePageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

export const revalidate = 3600;

export async function generateMetadata({
  searchParams
}: HomePageProps): Promise<Metadata> {
  const page = parsePageParam((await searchParams)?.page);
  const canonicalPath = paginatedCanonicalPath("/", page);
  const title =
    page > 1 ? `${siteConfig.name} Briefings - Page ${page}` : siteConfig.name;
  const image = absoluteUrl("/og-default.png");

  return {
    title,
    description: siteConfig.description,
    alternates: {
      canonical: absoluteUrl(canonicalPath)
    },
    openGraph: {
      title,
      description: siteConfig.description,
      url: absoluteUrl(canonicalPath),
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteConfig.description,
      images: [image]
    }
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = parsePageParam((await searchParams)?.page);
  const paginatedArticles = await getPaginatedPublishedArticles(page);

  if (paginatedArticles.totalCount > 0 && page > paginatedArticles.totalPages) {
    redirect(
      paginatedArticles.totalPages > 1
        ? `/?page=${paginatedArticles.totalPages}`
        : "/"
    );
  }

  const { articles } = paginatedArticles;

  return (
    <>
      <SiteHeader categories={[...CORE_CATEGORIES]} />

      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Hyper-Niche Industry Intelligence
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Analyst-grade briefings for operators who need signal, not noise.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              {siteConfig.name} monitors curated RSS sources, adds original
              industry context, and publishes concise B2B briefings with
              actionable takeaways.
            </p>
            {CORE_CATEGORIES.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {CORE_CATEGORIES.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-600"
                  >
                    {formatCategory(category)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {articles.length > 0 ? (
          <FeedWithSidebar>
            <ArticleFeed articles={articles} />
            <PaginationControls
              currentPage={paginatedArticles.page}
              totalPages={paginatedArticles.totalPages}
              basePath="/"
              hasPreviousPage={paginatedArticles.hasPreviousPage}
              hasNextPage={paginatedArticles.hasNextPage}
            />
          </FeedWithSidebar>
        ) : (
          <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
              <h2 className="text-2xl font-bold text-ink">No articles yet</h2>
              <p className="mt-3 text-stone-600">
                Add active RSS sources in Supabase, then run{" "}
                <code className="rounded bg-stone-100 px-2 py-1 text-sm">
                  npm run ingest
                </code>
                .
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
