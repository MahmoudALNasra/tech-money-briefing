"use client";

import { useState, useTransition } from "react";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { SubscribeBand } from "@/components/newsletter/SubscribeBand";
import type { ArticleSummary } from "@/lib/types";

type HomeArticleLoadMoreProps = {
  initialArticles: ArticleSummary[];
  initialPage: number;
  totalPages: number;
};

export function HomeArticleLoadMore({
  initialArticles,
  initialPage,
  totalPages
}: HomeArticleLoadMoreProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(initialPage);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasNextPage = page < totalPages;

  function loadMore() {
    if (!hasNextPage || isPending) return;

    const nextPage = page + 1;
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/articles/home?page=${nextPage}`, {
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error("Unable to load more briefings.");
        }

        const payload = (await response.json()) as {
          articles: ArticleSummary[];
          page: number;
          totalPages: number;
        };

        setArticles((current) => [...current, ...payload.articles]);
        setPage(payload.page);
        window.history.pushState({}, "", payload.page > 1 ? `/?page=${payload.page}` : "/");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load more briefings.");
      }
    });
  }

  const firstArticles = articles.slice(0, 9);
  const remainingArticles = articles.slice(9);

  return (
    <>
      <div className="articles-grid article-grid">
        {firstArticles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            featured={index === 0}
            priority={index < 2}
            variant="grid"
            animationIndex={index}
          />
        ))}
      </div>
      {articles.length > 9 ? (
        <>
          <SubscribeBand placementIndex={9} source="homepage_load_more_band" />
          <div className="articles-grid article-grid">
            {remainingArticles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="grid"
                animationIndex={index}
              />
            ))}
          </div>
        </>
      ) : null}
      <div className="mx-auto mt-10 flex max-w-[1140px] flex-col items-center gap-3 px-10">
        {hasNextPage ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-[3px] border border-white/[0.06] bg-[var(--bg-surface)] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] transition hover:border-[var(--border-accent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Loading..." : "Load More Briefs"}
          </button>
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
            End of briefing archive
          </p>
        )}
        {error ? (
          <p role="status" className="text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {hasNextPage ? (
          <a
            href={`/?page=${page + 1}`}
            rel="next"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-dim)] underline decoration-white/10 underline-offset-4 hover:text-[var(--text-secondary)]"
          >
            Crawlable page {page + 1}
          </a>
        ) : null}
      </div>
    </>
  );
}
