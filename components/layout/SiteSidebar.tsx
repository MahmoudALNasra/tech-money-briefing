import Image from "next/image";
import Link from "next/link";

import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";
import { getPublishedArticles } from "@/lib/articles";
import { CORE_CATEGORIES } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type SiteSidebarProps = {
  activeCategory?: string;
};

function formatBriefDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export async function SiteSidebar({ activeCategory }: SiteSidebarProps) {
  const latestArticles = await getPublishedArticles(6);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        {latestArticles[0]?.image_url ? (
          <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100">
            <Image
              src={latestArticles[0].image_url}
              alt=""
              fill
              sizes="300px"
              unoptimized
              className="object-cover"
            />
          </div>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          What We Cover
        </p>
        <h2 className="mt-3 text-lg font-black tracking-tight text-ink">
          Revenue-focused tech briefings
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {siteConfig.name} tracks AI tools, SEO, ecommerce, startups, fintech,
          and creator business signals for operators who want practical context,
          not noise.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-flex text-sm font-bold text-ink underline decoration-stone-300 underline-offset-4 hover:decoration-ink"
        >
          Learn how we brief
        </Link>
      </section>

      <NewsletterCapture placementIndex={0} source="sidebar" variant="compact" />

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          Explore Categories
        </p>
        <nav className="mt-4 grid gap-2" aria-label="Sidebar categories">
          {CORE_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/${category}`}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                category === activeCategory
                  ? "bg-ink text-white"
                  : "bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-ink"
              }`}
            >
              {formatCategory(category)}
            </Link>
          ))}
        </nav>
      </section>

      {latestArticles.length > 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Latest Briefings
          </p>
          <ul className="mt-4 space-y-4">
            {latestArticles.map((article) => {
              const publishedLabel = formatBriefDate(article.published_at);

              return (
                <li
                  key={article.id}
                  className="border-b border-stone-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="grid grid-cols-[64px_1fr] gap-3">
                    <Link
                      href={`/${article.category}/${article.slug}`}
                      className="relative block aspect-square overflow-hidden rounded-xl bg-stone-100"
                      aria-label={article.title}
                    >
                      {article.image_url ? (
                        <Image
                          src={article.image_url}
                          alt=""
                          fill
                          sizes="64px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300" />
                      )}
                    </Link>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        {formatCategory(article.category)}
                        {publishedLabel ? ` · ${publishedLabel}` : ""}
                      </p>
                      <Link
                        href={`/${article.category}/${article.slug}`}
                        className="mt-1 block text-sm font-bold leading-6 text-ink hover:text-stone-600"
                      >
                        {article.title}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
