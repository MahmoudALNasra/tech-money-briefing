import Image from "next/image";
import Link from "next/link";

import { formatCategory } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

type ArticleCardProps = {
  article: ArticleSummary;
  featured?: boolean;
  priority?: boolean;
};

export function ArticleCard({
  article,
  featured = false,
  priority = false
}: ArticleCardProps) {
  const publishedLabel = article.published_at
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date(article.published_at))
    : null;

  return (
    <article
      className={`border-b border-stone-200 py-8 ${
        featured ? "border-t border-stone-200" : ""
      }`}
    >
      <Link
        href={`/${article.category}/${article.slug}`}
        className="group grid gap-6 md:grid-cols-[220px_1fr]"
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-stone-200 ${
            featured ? "aspect-[16/10] md:aspect-[4/3]" : "aspect-[16/10]"
          }`}
        >
          {article.image_url ? (
            <Image
              src={article.image_url}
              alt=""
              fill
              sizes="220px"
              priority={priority}
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300" />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            <span>{formatCategory(article.category)}</span>
            {publishedLabel ? <span>{publishedLabel}</span> : null}
          </div>

          <h2
            className={`mt-3 font-black leading-tight tracking-tight text-ink group-hover:text-stone-700 ${
              featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {article.title}
          </h2>

          <p className="mt-3 text-base leading-7 text-stone-600">
            {article.meta_description}
          </p>

          {article.key_takeaways.length > 0 ? (
            <ul className="mt-5 space-y-2 border-t border-stone-100 pt-4">
              {article.key_takeaways.slice(0, 3).map((takeaway) => (
                <li
                  key={takeaway}
                  className="flex gap-3 text-sm leading-6 text-stone-700"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
