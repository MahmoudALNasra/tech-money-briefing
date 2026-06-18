"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ArticlePromotionCategoryGroup,
  ArticlePromotionDetail,
  ArticlePromotionRow
} from "@/lib/article-promotions";
import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";
import { formatCategory } from "@/lib/format";

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function formatWhen(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

function PlatformToggle({
  label,
  postedAt,
  disabled,
  onToggle
}: {
  label: string;
  postedAt: string | null;
  disabled?: boolean;
  onToggle: (nextPublished: boolean) => void;
}) {
  const posted = Boolean(postedAt);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(!posted)}
      title={posted ? `Posted ${formatWhen(postedAt)}` : `Mark as posted on ${label}`}
      className={`rounded-full border px-3 py-1.5 text-xs font-black transition disabled:cursor-wait disabled:opacity-60 ${
        posted
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
      }`}
    >
      {posted ? "Posted" : "Not posted"}
    </button>
  );
}

function CopyBlock({
  label,
  text,
  copyKey,
  copiedKey,
  onCopy
}: {
  label: string;
  text: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-ink">{label}</p>
        <button
          type="button"
          onClick={() => void onCopy(copyKey, text)}
          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-black text-stone-700 transition hover:bg-stone-100"
        >
          {copiedKey === copyKey ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-6 text-stone-700">
        {text}
      </pre>
    </div>
  );
}

export function ArticlePromotionsPanel() {
  const [categories, setCategories] = useState<ArticlePromotionCategoryGroup[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticlePromotionDetail | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showUnpostedOnly, setShowUnpostedOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/article-promotions", {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as {
        categories?: ArticlePromotionCategoryGroup[];
        totalArticles?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not load articles.");
      }

      const nextCategories = json.categories ?? [];
      setCategories(nextCategories);
      setTotalArticles(json.totalArticles ?? 0);
      setExpandedCategories((current) => {
        const next = { ...current };
        for (const group of nextCategories) {
          if (next[group.category] === undefined) {
            next[group.category] = true;
          }
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (articleId: string) => {
    setIsLoadingDetail(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/article-promotions/${encodeURIComponent(articleId)}`,
        { headers: await getBusinessDataAuthHeaders() }
      );
      const json = (await response.json()) as {
        article?: ArticlePromotionDetail;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not load article detail.");
      }

      setSelectedId(articleId);
      setSelectedArticle(json.article ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  const updatePromotion = async (
    articleId: string,
    platform: "instagram" | "linkedin",
    published: boolean
  ) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/article-promotions/${encodeURIComponent(articleId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getBusinessDataAuthHeaders())
          },
          body: JSON.stringify({ platform, published })
        }
      );
      const json = (await response.json()) as {
        article?: ArticlePromotionDetail;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not update promotion status.");
      }

      await loadArticles();

      if (selectedId === articleId && json.article) {
        setSelectedArticle((prev) =>
          prev
            ? {
                ...prev,
                published_on_instagram_at: json.article!.published_on_instagram_at,
                published_on_linkedin_at: json.article!.published_on_linkedin_at
              }
            : prev
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (key: string, text: string) => {
    await copyText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categories
      .map((group) => {
        const articles = group.articles.filter((article) => {
          const matchesQuery =
            !normalizedQuery ||
            article.title.toLowerCase().includes(normalizedQuery) ||
            article.url.toLowerCase().includes(normalizedQuery) ||
            article.meta_description.toLowerCase().includes(normalizedQuery);

          const matchesPostedFilter =
            !showUnpostedOnly ||
            !article.published_on_instagram_at ||
            !article.published_on_linkedin_at;

          return matchesQuery && matchesPostedFilter;
        });

        return { ...group, articles };
      })
      .filter((group) => group.articles.length > 0);
  }, [categories, query, showUnpostedOnly]);

  const postedCounts = useMemo(() => {
    const rows = categories.flatMap((group) => group.articles);

    return {
      instagram: rows.filter((row) => row.published_on_instagram_at).length,
      linkedin: rows.filter((row) => row.published_on_linkedin_at).length,
      both: rows.filter(
        (row) => row.published_on_instagram_at && row.published_on_linkedin_at
      ).length
    };
  }, [categories]);

  function renderArticleRow(article: ArticlePromotionRow) {
    const isSelected = selectedId === article.id;

    return (
      <tr
        key={article.id}
        className={`cursor-pointer border-t border-stone-100 transition ${
          isSelected ? "bg-emerald-50/70" : "hover:bg-stone-50"
        }`}
        onClick={() => void loadDetail(article.id)}
      >
        <td className="px-4 py-3 align-top">
          <p className="text-sm font-bold text-ink">{article.title}</p>
          <p className="mt-1 text-xs text-stone-500">
            {article.published_at
              ? new Date(article.published_at).toLocaleDateString()
              : "Unknown date"}
          </p>
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="break-all text-xs font-semibold text-emerald-700 underline"
            >
              {article.url}
            </a>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleCopy(`url-${article.id}`, article.url);
              }}
              className="w-fit rounded-full border border-stone-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-stone-600"
            >
              {copiedKey === `url-${article.id}` ? "Copied" : "Copy URL"}
            </button>
          </div>
        </td>
        <td className="px-4 py-3 align-top" onClick={(event) => event.stopPropagation()}>
          <PlatformToggle
            label="Instagram"
            postedAt={article.published_on_instagram_at}
            disabled={isSaving}
            onToggle={(published) => void updatePromotion(article.id, "instagram", published)}
          />
        </td>
        <td className="px-4 py-3 align-top" onClick={(event) => event.stopPropagation()}>
          <PlatformToggle
            label="LinkedIn"
            postedAt={article.published_on_linkedin_at}
            disabled={isSaving}
            onToggle={(published) => void updatePromotion(article.id, "linkedin", published)}
          />
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
            Backlink queue
          </p>
          <h1 className="mt-2 text-2xl font-black text-ink">Article social promotions</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Copy owner-voice LinkedIn and Instagram post bodies with direct article URLs, then mark
            each platform when published. Captions are generated with the same owner voice + emoji
            polish pipeline as social drafts. Nothing auto-posts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50"
          >
            Account ops
          </Link>
          <Link
            href="/admin/social-drafts"
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50"
          >
            Social drafts
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold text-stone-500">Published articles</p>
          <p className="mt-1 text-2xl font-black text-ink">{totalArticles}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold text-stone-500">Posted on Instagram</p>
          <p className="mt-1 text-2xl font-black text-ink">{postedCounts.instagram}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold text-stone-500">Posted on LinkedIn</p>
          <p className="mt-1 text-2xl font-black text-ink">{postedCounts.linkedin}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold text-stone-500">Posted on both</p>
          <p className="mt-1 text-2xl font-black text-ink">{postedCounts.both}</p>
        </div>
      </div>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, URL, or description"
          className="min-h-11 min-w-[240px] flex-1 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
        />
        <label className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={showUnpostedOnly}
            onChange={(event) => setShowUnpostedOnly(event.target.checked)}
          />
          Needs posting
        </label>
        <button
          type="button"
          onClick={() => void loadArticles()}
          disabled={isLoading}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          {isLoading ? (
            <p className="text-sm font-semibold text-stone-600">Loading articles...</p>
          ) : filteredCategories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-600">
              No articles match your filters.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((group) => {
                const expanded = expandedCategories[group.category] ?? true;

                return (
                  <div
                    key={group.category}
                    className="overflow-hidden rounded-2xl border border-stone-200"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategories((current) => ({
                          ...current,
                          [group.category]: !expanded
                        }))
                      }
                      className="flex w-full items-center justify-between gap-3 bg-stone-50 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-black text-ink">
                          {formatCategory(group.category)}
                        </p>
                        <p className="text-xs text-stone-500">
                          {group.articles.length} article
                          {group.articles.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                        {expanded ? "Hide" : "Show"}
                      </span>
                    </button>

                    {expanded ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                          <thead className="bg-white text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                            <tr>
                              <th className="px-4 py-3">Article</th>
                              <th className="px-4 py-3">Direct URL</th>
                              <th className="px-4 py-3">Instagram</th>
                              <th className="px-4 py-3">LinkedIn</th>
                            </tr>
                          </thead>
                          <tbody>{group.articles.map(renderArticleRow)}</tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          {!selectedArticle || isLoadingDetail ? (
            <p className="text-sm font-semibold text-stone-600">
              {isLoadingDetail
                ? "Generating owner-voice captions (10–20s)..."
                : "Select an article to preview LinkedIn and Instagram copy."}
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                  {formatCategory(selectedArticle.category)}
                </p>
                <h2 className="mt-2 text-xl font-black text-ink">{selectedArticle.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {selectedArticle.meta_description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <PlatformToggle
                    label="Instagram"
                    postedAt={selectedArticle.published_on_instagram_at}
                    disabled={isSaving}
                    onToggle={(published) =>
                      void updatePromotion(selectedArticle.id, "instagram", published)
                    }
                  />
                  <PlatformToggle
                    label="LinkedIn"
                    postedAt={selectedArticle.published_on_linkedin_at}
                    disabled={isSaving}
                    onToggle={(published) =>
                      void updatePromotion(selectedArticle.id, "linkedin", published)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void loadDetail(selectedArticle.id)}
                    disabled={isLoadingDetail}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-black text-stone-700 transition hover:bg-stone-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    Regenerate copy
                  </button>
                  {selectedArticle.usedOwnerVoice === false ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                      Template fallback
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                      Owner voice
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-ink">Direct article URL</p>
                  <button
                    type="button"
                    onClick={() => void handleCopy(`selected-url`, selectedArticle.url)}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-black text-stone-700"
                  >
                    {copiedKey === "selected-url" ? "Copied" : "Copy URL"}
                  </button>
                </div>
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-sm font-semibold text-emerald-700 underline"
                >
                  {selectedArticle.url}
                </a>
              </div>

              <div className="rounded-2xl border border-dashed border-stone-200 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                  SEO keywords in this copy
                </p>
                <p className="mt-2 text-sm text-stone-700">
                  {selectedArticle.keywords.join(" · ")}
                </p>
              </div>

              <CopyBlock
                label="LinkedIn post"
                text={selectedArticle.linkedin}
                copyKey="linkedin-body"
                copiedKey={copiedKey}
                onCopy={handleCopy}
              />

              <CopyBlock
                label="Instagram caption"
                text={selectedArticle.instagram}
                copyKey="instagram-body"
                copiedKey={copiedKey}
                onCopy={handleCopy}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
