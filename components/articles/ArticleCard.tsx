"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  shouldBypassArticleImageOptimization,
  shouldContainArticleImagePreview
} from "@/lib/article-image-optimization";
import { ARTICLE_EDITORIAL_SOURCE_NAME } from "@/lib/article-attribution";
import { formatCategory } from "@/lib/format";
import { articleImageAlt } from "@/lib/seo";
import type { ArticleSummary } from "@/lib/types";
import FadeContent from "@/components/ui/FadeContent";

type ArticleCardProps = {
  article: ArticleSummary;
  featured?: boolean;
  priority?: boolean;
  variant?: "list" | "grid";
  animationIndex?: number;
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

function GeneratedArticleThumbnail({
  title,
  category
}: {
  title: string;
  category: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-stone-100 p-5">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/60" />
      <div className="absolute -bottom-12 left-4 h-28 w-28 rounded-full bg-lime-200/70" />
      <div className="relative flex h-full flex-col justify-between">
        <div>
          <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">
            {formatCategory(category)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
            Tech Revenue Brief
          </p>
          <p className="mt-2 line-clamp-3 text-lg font-black leading-tight text-ink">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ArticleCard({
  article,
  featured = false,
  priority = false,
  variant = "list",
  animationIndex = 0
}: ArticleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = Boolean(article.image_url && !imageFailed);
  const shouldContainImage = shouldContainArticleImagePreview({
    slug: article.slug,
    imageUrl: article.image_url
  });
  const publishedLabel = article.published_at
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date(article.published_at))
    : null;

  if (variant === "grid") {
    return (
      <FadeContent
        blur={false}
        duration={0.45}
        delay={Math.min(animationIndex * 0.07, 0.35)}
        easing="ease-out"
        threshold={0.15}
        initialOpacity={0}
        className="article-card-fade-wrapper"
      >
      <article className="article-card">
        <Link
          href={`/${article.category}/${article.slug}`}
          aria-label={article.title}
          className="card-image-wrap article-card-media group"
        >
          {shouldShowImage ? (
            <Image
              src={article.image_url!}
              alt={articleImageAlt(article)}
              fill
              quality={65}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              unoptimized={shouldBypassArticleImageOptimization(article.image_url)}
              onError={() => setImageFailed(true)}
              className={`${
                shouldContainImage
                  ? "object-contain bg-stone-950"
                  : "object-cover transition duration-300 group-hover:scale-[1.02]"
              }`}
            />
          ) : (
            <div className="article-card-placeholder" aria-hidden="true">
              <span>◆</span>
            </div>
          )}
        </Link>

        <div className="card-body article-card-body">
          <div className="card-meta article-card-meta">
            <Link
              href={`/${article.category}`}
              className={`badge signal-badge ${categoryBadgeClass(article.category)}`}
            >
              {formatCategory(article.category)}
            </Link>
            {publishedLabel ? <span className="card-date">{publishedLabel}</span> : null}
          </div>

          <Link href={`/${article.category}/${article.slug}`} className="group">
            <h2 className="card-title article-card-title">{article.title}</h2>
          </Link>

          <p className="card-excerpt article-card-excerpt">{article.meta_description}</p>

          {article.key_takeaways.length > 0 ? (
            <ul className="card-bullets article-card-takeaways">
              {article.key_takeaways.slice(0, 3).map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
      </FadeContent>
    );
  }

  return (
    <article
      className={`border-b border-stone-200 py-8 ${
        featured ? "border-t border-stone-200" : ""
      }`}
    >
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <Link
          href={`/${article.category}/${article.slug}`}
          aria-label={article.title}
          className={`group relative overflow-hidden rounded-2xl bg-stone-200 ${
            featured ? "aspect-[16/10] md:aspect-[4/3]" : "aspect-[16/10]"
          }`}
        >
          {shouldShowImage ? (
            <Image
              src={article.image_url!}
              alt={articleImageAlt(article)}
              fill
              quality={65}
              sizes="(min-width: 768px) 220px, calc(100vw - 2.5rem)"
              priority={priority}
              unoptimized={shouldBypassArticleImageOptimization(article.image_url)}
              onError={() => setImageFailed(true)}
              className={`${
                shouldContainImage
                  ? "object-contain bg-stone-950"
                  : "object-cover transition duration-300 group-hover:scale-[1.02]"
              }`}
            />
          ) : (
            <GeneratedArticleThumbnail
              title={article.title}
              category={article.category}
            />
          )}
        </Link>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            <Link href={`/${article.category}`} className="hover:text-ink">
              {formatCategory(article.category)}
            </Link>
            {publishedLabel ? <span>{publishedLabel}</span> : null}
            <span>{ARTICLE_EDITORIAL_SOURCE_NAME}</span>
          </div>

          <Link href={`/${article.category}/${article.slug}`} className="group">
            <h2
              className={`mt-3 font-black leading-tight tracking-tight text-ink group-hover:text-stone-700 ${
                featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
              }`}
            >
              {article.title}
            </h2>
          </Link>

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
      </div>
    </article>
  );
}
