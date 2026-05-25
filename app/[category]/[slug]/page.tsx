import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleReadTracker } from "@/components/analytics/ArticleReadTracker";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollNewsletter } from "@/components/newsletter/ScrollNewsletter";
import { getArticleBySlug } from "@/lib/articles";
import { CORE_CATEGORIES } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { articleImage, articleUrl, newsArticleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { normalizeCategory } from "@/lib/slug";
import { calculateReadingTime } from "@/lib/utils";

type ArticlePageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export const revalidate = 3600;

export async function generateMetadata({
  params
}: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticleBySlug(normalizeCategory(category), slug);

  if (!article) {
    return {};
  }

  const url = articleUrl(article);
  const image = articleImage(article);

  return {
    title: article.title,
    description: article.meta_description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.meta_description,
      siteName: siteConfig.name,
      publishedTime: article.published_at ?? undefined,
      section: article.category,
      images: [
        {
          url: image,
          alt: article.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.meta_description,
      images: [image]
    }
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const article = await getArticleBySlug(normalizeCategory(category), slug);

  if (!article) {
    notFound();
  }

  const jsonLd = newsArticleJsonLd(article);
  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const publishedLabel = article.published_at
    ? new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(new Date(article.published_at))
    : null;
  const readingTime = calculateReadingTime(article.content);

  return (
    <>
      <SiteHeader
        categories={[...CORE_CATEGORIES]}
        activeCategory={article.category}
      />
      <main className="bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ArticleReadTracker
          articleId={article.id}
          slug={article.slug}
          category={article.category}
        />
        <ScrollNewsletter />

        <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <Link
            href={`/${article.category}`}
            className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-700"
          >
            {formatCategory(article.category)}
          </Link>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
            {article.title}
          </h1>

          <p className="mt-5 text-lg leading-8 text-muted">
            {article.meta_description}
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500">
            <li>
              Source:{" "}
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink underline decoration-stone-300 underline-offset-4 hover:decoration-ink"
              >
                {article.source_name}
              </a>
            </li>
            {publishedLabel ? (
              <li>
                <time dateTime={article.published_at!}>{publishedLabel}</time>
              </li>
            ) : null}
            <li>{readingTime} min read</li>
            <li>Share ID: {article.share_id}</li>
          </ul>

          <div className="relative mt-8 aspect-square overflow-hidden rounded-3xl bg-gray-100">
            {article.image_url ? (
              <Image
                src={article.image_url}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300" />
            )}
          </div>

          <div className="article-content prose prose-lg mt-10 max-w-none prose-headings:text-ink prose-a:text-ink">
            {article.key_takeaways.length > 0 ? (
              <aside className="not-prose mb-10 rounded-3xl border border-gray-200 bg-[#fbfaf7] p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                  Analyst Takeaways
                </h2>
                <ul className="mt-4 space-y-3 text-base leading-7 text-ink">
                  {article.key_takeaways.map((takeaway) => (
                    <li key={takeaway} className="flex gap-3">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <aside className="mt-10 rounded-3xl border border-stone-200 bg-stone-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Source Attribution
            </p>
            <h2 className="mt-3 text-xl font-black tracking-tight text-ink">
              Original source
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              This briefing cites and links back to the original publisher for
              transparency and reader verification.
            </p>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
            >
              Visit {article.source_name}
            </a>
          </aside>
        </article>

        <RelatedArticles
          currentArticleId={article.id}
          category={article.category}
        />
      </main>
    </>
  );
}
