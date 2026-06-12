import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { ArticleReadTracker } from "@/components/analytics/ArticleReadTracker";
import { ArticleHumanLayer } from "@/components/articles/ArticleHumanLayer";
import { ArticleShareToolbar } from "@/components/articles/ArticleShareToolbar";
import { ArticleInlineMedia } from "@/components/articles/ArticleInlineMedia";
import { ArticleInternalLinks } from "@/components/articles/ArticleInternalLinks";
import { ArticleReferralLinks } from "@/components/articles/ArticleReferralLinks";
import { ArticleToolRecommendations } from "@/components/articles/ArticleToolRecommendations";
import { ArticleVideoSection } from "@/components/articles/ArticleVideoSection";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MonetizationRail } from "@/components/monetization/MonetizationRail";
import { BackButton } from "@/components/navigation/BackButton";
import { ScrollNewsletter } from "@/components/newsletter/ScrollNewsletter";
import { ToolAssistant } from "@/components/tools/ToolAssistant";
import { articleRobotsForAdsense } from "@/lib/adsense-readiness";
import { shouldBypassArticleImageOptimization } from "@/lib/article-image-optimization";
import { getArticleMedia } from "@/lib/article-media";
import { resolveArticleHeroImage } from "@/lib/article-images";
import {
  getContentHeadings,
  normalizeArticleContent,
  renderArticleBlock
} from "@/lib/article-markdown";
import { getArticleBySlug } from "@/lib/articles";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { formatCategory } from "@/lib/format";
import {
  articleImage,
  articleImageAlt,
  articleUrl,
  faqJsonLd,
  newsArticleJsonLd
} from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { normalizeCategory } from "@/lib/slug";
import { calculateReadingTime } from "@/lib/utils";
import type { ArticleMedia } from "@/lib/types";

type ArticlePageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function articleKeywords(article: Awaited<ReturnType<typeof getArticleBySlug>>) {
  if (!article) {
    return [];
  }

  return [
    article.title,
    article.category,
    ...article.key_takeaways,
    siteConfig.name
  ]
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function ArticleVisualBreak({
  label,
  title,
  takeaway,
  category
}: {
  label: string;
  title: string;
  takeaway: string;
  category: string;
}) {
  return (
    <aside className="not-prose my-8 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            {label}
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            {formatCategory(category)}
          </p>
        </div>
        <h3 className="mt-4 text-xl font-black leading-tight tracking-tight text-ink sm:text-2xl">
          {title}
        </h3>
      </div>
      <div className="bg-white p-5">
        <p className="text-base font-semibold leading-7 text-stone-800">
          {takeaway}
        </p>
      </div>
    </aside>
  );
}

function ArticleExternalImage({ media }: { media: ArticleMedia }) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <img
        src={media.url}
        alt={media.alt_text || media.title}
        loading="lazy"
        className="mx-auto block h-auto max-h-[32rem] w-full bg-stone-50 object-contain"
      />
      <figcaption className="border-t border-stone-200 bg-stone-50 px-5 py-3 text-xs font-semibold leading-5 text-stone-600">
        {media.caption || media.title}
        {media.source_url ? (
          <>
            {" "}
            <a
              href={media.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-ink underline decoration-stone-300 underline-offset-4"
            >
              Source
            </a>
          </>
        ) : null}
      </figcaption>
    </figure>
  );
}

export async function generateMetadata({
  params
}: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticleBySlug(normalizeCategory(category), slug);

  if (!article) {
    return {};
  }

  const articleMedia = await getArticleMedia(article.id);
  const resolvedHero = await resolveArticleHeroImage({
    image_url: article.image_url,
    media: articleMedia
  });
  const url = articleUrl(article);
  const image = articleImage(article, resolvedHero);

  return {
    title: article.title,
    description: article.meta_description,
    publisher: siteConfig.name,
    keywords: articleKeywords(article),
    robots: articleRobotsForAdsense(article),
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
  const inlineVideos = articleMedia
    .filter((item) => item.provider === "youtube")
    .slice(0, 2);
  const inlineImages = articleMedia
    .filter((item) => item.provider === "image")
    .slice(0, 3);
  const prefersVideoMedia = inlineVideos.length > 0;
  const heroImageUrl = await resolveArticleHeroImage({
    image_url: article.image_url,
    media: articleMedia
  });
  const jsonLd = newsArticleJsonLd(
    article,
    heroImageUrl,
    inlineImages.map((image) => ({
      url: image.url,
      caption: image.caption
    }))
  );
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
        categories={getPublicNavCategories()}
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
        {process.env.NEXT_PUBLIC_ENABLE_SCROLL_NEWSLETTER === "true" ? (
          <ScrollNewsletter />
        ) : null}

        <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <div className="mb-5">
            <BackButton
              fallbackHref={`/${article.category}`}
              label={`Back to ${formatCategory(article.category)}`}
            />
          </div>

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

          <ArticleHumanLayer article={article} variant="intro" />

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

          <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-stone-100">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt={articleImageAlt(article)}
                width={1200}
                height={800}
                priority
                quality={75}
                unoptimized={shouldBypassArticleImageOptimization(heroImageUrl)}
                sizes="(min-width: 768px) 768px, 100vw"
                className="mx-auto block h-auto max-h-[32rem] w-full object-contain"
              />
            ) : (
              <div className="grid h-full w-full place-items-end bg-gradient-to-br from-ink via-stone-800 to-emerald-700 p-8 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-200">
                    Tech Revenue Brief
                  </p>
                  <p className="mt-4 text-3xl font-black leading-tight">
                    {article.title}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="article-content prose prose-lg mt-10 max-w-none scroll-mt-24 prose-headings:scroll-mt-24 prose-headings:text-ink prose-a:text-ink prose-strong:text-ink prose-li:marker:text-emerald-600">
            {contentBlocks.map((block, index) => (
              <Fragment key={`${block}-${index}`}>
                {renderArticleBlock(block)}
                {index === 2 && inlineVideos[0] ? (
                  <ArticleInlineMedia
                    media={inlineVideos[0]}
                    label="Related Watch"
                  />
                ) : null}
                {index === 3 && inlineImages[0] ? (
                  <ArticleExternalImage media={inlineImages[0]} />
                ) : null}
                {index === 4 && article.key_takeaways[0] && !prefersVideoMedia ? (
                  <ArticleVisualBreak
                    label="Key Takeaway"
                    title={article.title}
                    takeaway={article.key_takeaways[0]}
                    category={article.category}
                  />
                ) : null}
                {index === 7 && inlineVideos[1] ? (
                  <ArticleInlineMedia
                    media={inlineVideos[1]}
                    label="More Context"
                  />
                ) : null}
                {index === 8 && inlineImages[1] ? (
                  <ArticleExternalImage media={inlineImages[1]} />
                ) : null}
                {index === 12 && inlineImages[2] ? (
                  <ArticleExternalImage media={inlineImages[2]} />
                ) : null}
                {index === 10 && article.key_takeaways[1] && inlineVideos.length < 2 ? (
                  <ArticleVisualBreak
                    label="Operator Note"
                    title="What to remember"
                    takeaway={article.key_takeaways[1]}
                    category={article.category}
                  />
                ) : null}
              </Fragment>
            ))}
          </div>

          <ArticleVideoSection media={articleMedia} />

          <ArticleHumanLayer article={article} variant="full" />

          <ArticleToolRecommendations article={article} />

          <ArticleReferralLinks article={article} />

          <ArticleInternalLinks article={article} />

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

        <section className="mx-auto max-w-3xl px-5 sm:px-8">
          <MonetizationRail
            context="article"
            placementIndex={7}
            newsletterSource={`article_${article.slug}`}
            newsletterTitle="Weekly AI, SEO, and revenue tools in your inbox."
            newsletterDescription="Short signals on tools, monetization tests, and publishable assets—built for founders and operators."
          />
        </section>

        <RelatedArticles
          currentArticleId={article.id}
          category={article.category}
        />
      </main>
      <ToolAssistant
        context="article"
        pageHref={`/${article.category}/${article.slug}`}
        pageTitle={article.title}
        pageSummary={article.meta_description}
        category={article.category}
      />
    </>
  );
}
