import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeArticleLoadMore } from "@/components/articles/HomeArticleLoadMore";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeScrollController } from "@/components/home/HomeScrollController";
import { PopularComparisons } from "@/components/home/PopularComparisons";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ToolAssistant } from "@/components/tools/ToolAssistant";
import { getPaginatedHomepageArticles, getPublishedCategories } from "@/lib/articles";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { isCoreCategory } from "@/lib/categories";
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
  const image = absoluteUrl("/og-default-v3.png");

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
  const paginatedArticles = await getPaginatedHomepageArticles(page);

  if (paginatedArticles.totalCount > 0 && page > paginatedArticles.totalPages) {
    redirect(
      paginatedArticles.totalPages > 1
        ? `/?page=${paginatedArticles.totalPages}`
        : "/"
    );
  }

  const { articles } = paginatedArticles;
  const heroCategories = await getPublishedCategories()
    .then((categories) =>
      categories.filter(isCoreCategory).map(formatCategory)
    )
    .catch(() => getPublicNavCategories().map(formatCategory));
  const articleFeedJson = JSON.stringify(
    articles.map(({ title, meta_description, category }) => ({
      title,
      meta_description,
      category
    }))
  ).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader categories={getPublicNavCategories()} />
      <HomeScrollController />

      <main className="trb-home">
        <script
          id="trb-articles-data"
          dangerouslySetInnerHTML={{
            __html: `window.__TRB_ARTICLES__=${articleFeedJson};`
          }}
        />
        <HomeHero categories={heroCategories} />

        <PopularComparisons />

        <div className="section-divider" role="separator">
          <div className="divider-line" />
          <span className="divider-label">Latest Briefs</span>
          <div className="divider-line" />
        </div>

        {articles.length > 0 ? (
          <section
            id="articles"
            className="home-articles"
            aria-labelledby="latest-briefs-heading"
          >
            <div className="home-articles-inner">
              <h2 id="latest-briefs-heading" className="sr-only">
                Latest Briefs
              </h2>
              <HomeArticleLoadMore
                initialArticles={articles}
                initialPage={paginatedArticles.page}
                totalPages={paginatedArticles.totalPages}
              />
            </div>
          </section>
        ) : (
          <section id="articles" className="home-articles articles-visible">
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
              <div className="rounded-md border border-dashed border-white/10 bg-[var(--bg-surface)] p-10 text-center">
                <h2 className="text-2xl font-bold text-white">No articles yet</h2>
                <p className="mt-3 text-slate-400">
                  Add active RSS sources in Supabase, then run{" "}
                  <code className="rounded bg-white/10 px-2 py-1 text-sm">
                    npm run ingest
                  </code>
                  .
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      <ToolAssistant
        context="home"
        pageHref="/"
        pageTitle={siteConfig.name}
        pageSummary={siteConfig.description}
      />
    </>
  );
}
