import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleReadTracker } from "@/components/analytics/ArticleReadTracker";
import { ArticleShareToolbar } from "@/components/articles/ArticleShareToolbar";
import { ArticleToolRecommendations } from "@/components/articles/ArticleToolRecommendations";
import { ArticleVideoSection } from "@/components/articles/ArticleVideoSection";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollNewsletter } from "@/components/newsletter/ScrollNewsletter";
import { getArticleMedia } from "@/lib/article-media";
import { getArticleBySlug } from "@/lib/articles";
import { CORE_CATEGORIES } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { articleImage, articleUrl, faqJsonLd, newsArticleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { normalizeCategory } from "@/lib/slug";
import { calculateReadingTime } from "@/lib/utils";

type ArticlePageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeArticleContent(content: string) {
  return content.replace(/\\([#*_`])/g, "$1");
}

function renderInlineContent(text: string) {
  const cleaned = text.replace(/\*\*/g, "");
  const parts = cleaned.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);

    if (!match) {
      return part;
    }

    return (
      <a
        key={`${match[2]}-${index}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[1]}
      </a>
    );
  });
}

function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getContentHeadings(blocks: string[]) {
  return blocks
    .map((block) => {
      const match = block.match(/^(#{2,4})\s+(.+)$/);

      if (!match) {
        return null;
      }

      const label = match[2].replace(/\*\*/g, "").trim();

      return {
        id: headingId(label),
        label,
        level: match[1].length
      };
    })
    .filter((heading): heading is { id: string; label: string; level: number } =>
      Boolean(heading?.id && heading.label)
    )
    .slice(0, 8);
}

function renderArticleBlock(block: string) {
  const headingMatch = block.match(/^(#{2,4})\s+(.+)$/);

  if (headingMatch) {
    const label = headingMatch[2];
    const id = headingId(label);

    if (headingMatch[1].length >= 3) {
      return (
        <h3 key={block} id={id}>
          {renderInlineContent(label)}
        </h3>
      );
    }

    return (
      <h2 key={block} id={id}>
        {renderInlineContent(label)}
      </h2>
    );
  }

  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const isUnorderedList =
    lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));
  const isOrderedList =
    lines.length > 1 && lines.every((line) => /^\d+\.\s+/.test(line));

  if (isUnorderedList || isOrderedList) {
    const ListTag = isOrderedList ? "ol" : "ul";

    return (
      <ListTag key={block}>
        {lines.map((line) => (
          <li key={line}>
            {renderInlineContent(line.replace(/^([-*]|\d+\.)\s+/, ""))}
          </li>
        ))}
      </ListTag>
    );
  }

  return <p key={block}>{renderInlineContent(block)}</p>;
}

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

  const articleMedia = await getArticleMedia(article.id);
  const jsonLd = newsArticleJsonLd(article);
  const faqLd = faqJsonLd(article);
  const contentBlocks = normalizeArticleContent(article.content)
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
  const tableOfContents = getContentHeadings(contentBlocks);
  const url = articleUrl(article);

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
        {faqLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
          />
        ) : null}
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

          <ArticleShareToolbar title={article.title} url={url} />

          <section className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 text-white shadow-xl shadow-stone-950/10">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-300">
                  Start Here
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">
                  TL;DR
                </h2>
                {article.key_takeaways.length > 0 ? (
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-stone-100">
                    {article.key_takeaways.slice(0, 3).map((takeaway) => (
                      <li key={takeaway} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime-300" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-stone-100">
                    Read the quick answer first, then use the section links to
                    jump into details.
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 bg-white/5 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-300">
                  In This Briefing
                </p>
                {tableOfContents.length > 0 ? (
                  <nav className="mt-4 grid gap-2" aria-label="Article table of contents">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`rounded-2xl px-3 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10 ${
                          heading.level >= 3 ? "ml-3 text-stone-300" : ""
                        }`}
                      >
                        {heading.label}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-stone-100">
                    Scroll for the main answer, source context, and related tools.
                  </p>
                )}
              </div>
            </div>
          </section>

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

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Scan Path
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                Answer first, details second
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Trust Cue
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                Source linked for verification
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Time Cost
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {readingTime} min read
              </p>
            </div>
          </div>

          <div className="relative mt-8 aspect-square overflow-hidden rounded-3xl bg-gray-100">
            {article.image_url ? (
              <Image
                src={article.image_url}
                alt=""
                fill
                priority
                quality={65}
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300" />
            )}
          </div>

          <div className="article-content prose prose-lg mt-10 max-w-none scroll-mt-24 prose-headings:scroll-mt-24 prose-headings:text-ink prose-a:text-ink">
            {contentBlocks.map(renderArticleBlock)}
          </div>

          <ArticleVideoSection media={articleMedia} />

          <ArticleToolRecommendations article={article} />

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
