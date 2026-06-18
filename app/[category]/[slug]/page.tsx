import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { ArticleReadTracker } from "@/components/analytics/ArticleReadTracker";
import { ArticleInternalLinks } from "@/components/articles/ArticleInternalLinks";
import { ArticleShareToolbar } from "@/components/articles/ArticleShareToolbar";
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
import { ARTICLE_EDITORIAL_SOURCE_NAME } from "@/lib/article-attribution";
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
import { buildPageMetadata } from "@/lib/page-metadata";
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

function ArticleInlineImage({
  image,
  priority = false
}: {
  image: Awaited<ReturnType<typeof getArticleMedia>>[number];
  priority?: boolean;
}) {
  const imageSrc = image.url || image.thumbnail_url;

  if (!imageSrc) {
    return null;
  }

  return (
    <figure className="not-prose my-10 overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm">
      <Image
        src={imageSrc}
        alt={image.alt_text ?? image.title}
        width={1200}
        height={800}
        priority={priority}
        quality={75}
        unoptimized={shouldBypassArticleImageOptimization(imageSrc)}
        sizes="(min-width: 768px) 768px, 100vw"
        className="h-auto max-h-[30rem] w-full object-contain"
      />
      {image.caption || image.source_name ? (
        <figcaption className="border-t border-stone-200 px-5 py-3 text-xs leading-5 text-stone-600">
          {image.caption ? <span>{image.caption}</span> : null}
          {image.source_url && image.source_name ? (
            <>
              {" "}
              <a
                href={image.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Source: {image.source_name}
              </a>
            </>
          ) : image.source_name ? (
            <span> Source: {image.source_name}</span>
          ) : null}
        </figcaption>
      ) : null}
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

  return buildPageMetadata({
    title: article.title,
    description: article.meta_description,
    path: `/${article.category}/${article.slug}`,
    type: "article",
    publishedTime: article.published_at ?? undefined,
    section: article.category,
    image: {
      url: image,
      width: 1200,
      height: 630,
      alt: articleImageAlt(article)
    },
    keywords: articleKeywords(article),
    robots: articleRobotsForAdsense(article)
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const article = await getArticleBySlug(normalizeCategory(category), slug);

  if (!article) {
    notFound();
  }

  const articleMedia = await getArticleMedia(article.id);
  const heroImageUrl = await resolveArticleHeroImage({
    image_url: article.image_url,
    media: articleMedia
  });
  const inlineImages = articleMedia
    .filter((item) => {
      if (item.provider !== "image") {
        return false;
      }

      const imageSrc = item.url || item.thumbnail_url;
      return Boolean(imageSrc && imageSrc !== heroImageUrl);
    })
    .slice(0, 3);
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
      <main className="bg-[var(--bg-base)]">
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

        <article className="mx-auto max-w-[840px] px-5 py-10 sm:px-8">
          <div className="mb-5">
            <BackButton
              fallbackHref={`/${article.category}`}
              label={`Back to ${formatCategory(article.category)}`}
            />
          </div>

          <Link
            href={`/${article.category}`}
            className="badge badge-ai inline-flex"
          >
            {formatCategory(article.category)}
          </Link>

          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl">
            {article.title}
          </h1>

          <p className="mt-5 text-lg leading-8 text-[var(--text-muted)]">
            {article.meta_description}
          </p>

          <ArticleShareToolbar title={article.title} url={url} />

          <section className="mt-8 overflow-hidden rounded-md border border-white/[0.06] bg-[var(--bg-surface)] text-white shadow-xl shadow-black/20">
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

              <div className="tldr-action-panel border-t border-white/10 bg-white/5 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-300">
                  In This Briefing
                </p>
                {tableOfContents.length > 0 ? (
                  <nav className="mt-4 grid gap-2" aria-label="Article table of contents">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`tldr-nav-link rounded-[3px] px-3 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10 ${
                          heading.level >= 3 ? "ml-3 text-stone-300" : ""
                        }`}
                      >
                        {heading.label}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-stone-100">
                    Scroll for the main answer, practical context, and related tools.
                  </p>
                )}
              </div>
            </div>
          </section>

          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-dim)]">
            <li>{ARTICLE_EDITORIAL_SOURCE_NAME}</li>
            {publishedLabel ? (
              <li>
                <time dateTime={article.published_at!}>{publishedLabel}</time>
              </li>
            ) : null}
            <li>{readingTime} min read</li>
            <li>Share ID: {article.share_id}</li>
          </ul>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-white/[0.06] bg-[var(--bg-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                Reading format
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                TL;DR first, then details
              </p>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-[var(--bg-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                Editorial process
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                AI-assisted draft, reviewed before publish
              </p>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-[var(--bg-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                Time Cost
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {readingTime} min read
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-md border border-white/[0.06] bg-[var(--bg-surface)]">
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

          <div className="article-content prose prose-invert prose-lg mt-10 max-w-none scroll-mt-24 prose-headings:scroll-mt-24 prose-strong:text-[var(--text-primary)] prose-li:marker:text-[var(--accent-blue)]">
            {contentBlocks.map((block, index) => {
              const imageIndex = Math.floor(index / 3);
              const inlineImage =
                index > 0 && index % 3 === 0
                  ? inlineImages[imageIndex - 1]
                  : null;

              return (
                <Fragment key={`${block}-${index}`}>
                  {renderArticleBlock(block)}
                  {inlineImage ? (
                    <ArticleInlineImage
                      image={inlineImage}
                      priority={imageIndex === 1}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </div>

          <ArticleVideoSection media={articleMedia} />
          <ArticleToolRecommendations article={article} />
          <ArticleInternalLinks article={article} />
          <ArticleReferralLinks article={article} />

          <aside className="mt-10 rounded-md border border-white/[0.06] bg-[var(--bg-surface)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
              Editorial Note
            </p>
            <h2 className="mt-3 font-serif text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Written for Tech Revenue Brief readers
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              This article is prepared by Tech Revenue Brief Editors with a focus
              on practical business value, tool decisions, and monetization
              context. Outside feeds may help us spot topics, but the article is
              written for this site rather than republished from another outlet.
            </p>
          </aside>
        </article>

        <section className="mx-auto max-w-[840px] px-5 sm:px-8">
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
