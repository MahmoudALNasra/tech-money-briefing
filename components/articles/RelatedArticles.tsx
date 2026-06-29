import Image from "next/image";
import Link from "next/link";

import {
  shouldBypassArticleImageOptimization,
  shouldContainArticleImagePreview
} from "@/lib/article-image-optimization";
import { getRelatedArticles } from "@/lib/articles";
import { formatCategory } from "@/lib/format";
import { articleImageAlt } from "@/lib/seo";
import FadeContent from "@/components/ui/FadeContent";

type RelatedArticlesProps = {
  currentArticleId: string;
  category: string;
};

function categoryBadgeClass(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("ai")) return "badge-ai";
  if (normalized.includes("seo")) return "badge-seo";
  if (normalized.includes("fintech")) return "badge-fintech";
  if (normalized.includes("startup")) return "badge-startups";
  if (normalized.includes("ecommerce")) return "badge-ecommerce";
  if (normalized.includes("marketing")) return "badge-digital";
  if (normalized.includes("creator")) return "badge-creator";
  if (normalized.includes("lead")) return "badge-leads";

  return "badge-ai";
}

export async function RelatedArticles({
  currentArticleId,
  category
}: RelatedArticlesProps) {
  const articles = await getRelatedArticles(currentArticleId, category, 3);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/[0.06] bg-[var(--bg-base)]">
      <div className="mx-auto max-w-[1140px] px-5 py-14 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Keep Reading
        </p>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Related Briefings
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {articles.map((article, index) => (
            <FadeContent
              key={article.id}
              blur={false}
              duration={0.45}
              delay={Math.min(index * 0.07, 0.35)}
              threshold={0.15}
              className="article-card-fade-wrapper"
            >
            <article className="article-card">
              <Link
                href={`/${article.category}/${article.slug}`}
                aria-label={article.title}
                className="group block"
              >
                <div className="card-image-wrap relative">
                  {article.image_url ? (
                    <Image
                      src={article.image_url}
                      alt={articleImageAlt(article)}
                      fill
                      quality={65}
                      sizes="(min-width: 768px) 33vw, 100vw"
                      unoptimized={shouldBypassArticleImageOptimization(
                        article.image_url
                      )}
                      className={`${
                        shouldContainArticleImagePreview({
                          slug: article.slug,
                          imageUrl: article.image_url
                        })
                          ? "object-contain bg-stone-950"
                          : "object-cover transition duration-300 group-hover:scale-[1.02]"
                      }`}
                    />
                  ) : (
                    <div className="h-full w-full bg-[var(--bg-elevated)]" />
                  )}
                </div>
              </Link>
              <div className="card-body">
                <p className={`badge w-fit ${categoryBadgeClass(article.category)}`}>
                  {formatCategory(article.category)}
                </p>
                <h3 className="card-title">
                  <Link
                    href={`/${article.category}/${article.slug}`}
                    className="hover:text-[var(--accent-blue)]"
                  >
                    {article.title}
                  </Link>
                </h3>
                <Link
                  href={`/${article.category}/${article.slug}`}
                  className="mt-2 inline-flex text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-dim)] transition hover:text-[var(--text-primary)]"
                >
                  Read Briefing
                </Link>
              </div>
            </article>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  );
}
