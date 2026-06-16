import { Fragment } from "react";

import { NativeAdCard } from "@/components/ads/NativeAdCard";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";
import { SubscribeBand } from "@/components/newsletter/SubscribeBand";
import { PromotedPartnerCard } from "@/components/promotions/PromotedPartnerCard";
import type { ArticleSummary } from "@/lib/types";

type ArticleFeedProps = {
  articles: ArticleSummary[];
  newsletterInterval?: number;
  adInterval?: number;
  promotionInterval?: number;
  variant?: "list" | "grid";
};

export function ArticleFeed({
  articles,
  newsletterInterval = 3,
  adInterval = 0,
  promotionInterval = 0,
  variant = "list"
}: ArticleFeedProps) {
  if (variant === "grid") {
    const firstArticles = articles.slice(0, 9);
    const remainingArticles = articles.slice(9);

    return (
      <>
        <div className="articles-grid article-grid">
          {firstArticles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              featured={index === 0}
              priority={index < 2}
              variant="grid"
              animationIndex={index}
            />
          ))}
        </div>
        {articles.length > 9 ? (
          <>
            <SubscribeBand placementIndex={9} source="article_grid_band" />
            <div className="articles-grid article-grid">
              {remainingArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  priority={index < 2}
                  variant="grid"
                  animationIndex={index}
                />
              ))}
            </div>
          </>
        ) : null}
      </>
    );
  }

  return (
    <div className="w-full">
      {articles.map((article, index) => {
        const shouldInjectNewsletter =
          newsletterInterval > 0 && (index + 1) % newsletterInterval === 0;
        const shouldInjectAd = adInterval > 0 && (index + 1) % adInterval === 0;
        const shouldInjectPromotion =
          promotionInterval > 0 && (index + 1) % promotionInterval === 0;

        return (
          <Fragment key={article.id}>
            <ArticleCard
              article={article}
              featured={index === 0}
              priority={index < 2}
              variant={variant}
            />
            {shouldInjectNewsletter ? (
              <div className="py-2">
                <NewsletterCapture placementIndex={index + 1} />
              </div>
            ) : null}
            {shouldInjectPromotion ? (
              <div className="py-2">
                <PromotedPartnerCard placementIndex={index + 1} />
              </div>
            ) : null}
            {shouldInjectAd ? (
              <div className="py-2">
                <NativeAdCard slotIndex={index + 1} />
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
