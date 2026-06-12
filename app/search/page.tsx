import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SearchForm } from "@/components/search/SearchForm";
import { searchPublishedArticles } from "@/lib/articles";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { COMPARISONS } from "@/lib/comparisons";
import { FREE_TOOLS } from "@/lib/free-tools";
import { siteConfig } from "@/lib/site";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

type SearchableItem = {
  href: string;
  title: string;
  description: string;
  type: "Tool" | "Comparison";
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Search ${siteConfig.name}`,
  description: `Search briefings, free tools, and comparison pages from ${siteConfig.name}.`,
  robots: {
    index: true,
    follow: true
  }
};

function getSearchQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function normalize(value: string) {
  return value.toLowerCase();
}

function matchesQuery(item: SearchableItem, query: string) {
  const haystack = normalize(`${item.title} ${item.description} ${item.type}`);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function searchLocalItems(query: string): SearchableItem[] {
  if (!query) {
    return [];
  }

  const tools: SearchableItem[] = FREE_TOOLS.map((tool) => ({
    href: tool.href,
    title: tool.title,
    description: tool.description,
    type: "Tool"
  }));
  const comparisons: SearchableItem[] = COMPARISONS.map((comparison) => ({
    href: `/compare/${comparison.slug}`,
    title: comparison.title,
    description: comparison.description,
    type: "Comparison"
  }));

  return [...tools, ...comparisons].filter((item) => matchesQuery(item, query));
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = getSearchQuery((await searchParams)?.q);
  const [articles, localResults] = await Promise.all([
    searchPublishedArticles(query),
    Promise.resolve(searchLocalItems(query))
  ]);
  const hasQuery = query.length > 0;
  const hasResults = articles.length > 0 || localResults.length > 0;

  return (
    <>
      <SiteHeader categories={getPublicNavCategories()} />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Search
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Find briefings, tools, and comparisons
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Search across published articles, free calculators, generators,
              and comparison pages.
            </p>
            <div className="mt-8 max-w-2xl">
              <SearchForm
                initialQuery={query}
                placeholder="Try AdSense, Shopify, AI, TikTok, or newsletter"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          {hasQuery ? (
            <p className="text-sm font-semibold text-stone-600">
              {hasResults
                ? `Results for "${query}"`
                : `No results found for "${query}"`}
            </p>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8">
              <h2 className="text-2xl font-black text-ink">
                Start with a keyword
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Search for a company, platform, category, monetization term, or
                workflow.
              </p>
            </div>
          )}

          {localResults.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-2xl font-black text-ink">
                Tools and comparisons
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {localResults.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400 hover:shadow-md"
                  >
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                      {item.type}
                    </span>
                    <h3 className="mt-4 text-xl font-black text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {articles.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-2xl font-black text-ink">Briefings</h2>
              <div className="mt-2 rounded-3xl border border-stone-200 bg-white px-5">
                {articles.map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    featured={index === 0}
                    priority={index < 2}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
