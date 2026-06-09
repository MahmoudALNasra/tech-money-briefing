import Image from "next/image";
import Link from "next/link";

import { getRelatedArticles } from "@/lib/articles";
import { formatCategory } from "@/lib/format";
import { articleImageAlt } from "@/lib/seo";

type RelatedArticlesProps = {
  currentArticleId: string;
  category: string;
};

export async function RelatedArticles({
  currentArticleId,
  category
}: RelatedArticlesProps) {
  const articles = await getRelatedArticles(currentArticleId, category, 3);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
          Keep Reading
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
          Related Briefings
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
            >
              <Link
                href={`/${article.category}/${article.slug}`}
                aria-label={article.title}
                className="group block"
              >
                <div className="relative aspect-[16/10] bg-stone-200">
                  {article.image_url ? (
                    <Image
                      src={article.image_url}
                      alt={articleImageAlt(article)}
                      fill
                      quality={65}
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300" />
                  )}
                </div>
              </Link>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {formatCategory(article.category)}
                </p>
                <h3 className="mt-3 text-lg font-black leading-tight tracking-tight text-ink">
                  <Link
                    href={`/${article.category}/${article.slug}`}
                    className="hover:text-stone-700"
                  >
                    {article.title}
                  </Link>
                </h3>
                <Link
                  href={`/${article.category}/${article.slug}`}
                  className="mt-5 inline-flex text-sm font-bold text-ink underline decoration-stone-300 underline-offset-4 hover:decoration-ink"
                >
                  Read Briefing
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
