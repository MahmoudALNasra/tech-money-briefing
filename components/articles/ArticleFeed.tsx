import { Fragment } from "react";

import { NativeAdCard } from "@/components/ads/NativeAdCard";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";
import { PromotedPartnerCard } from "@/components/promotions/PromotedPartnerCard";
import type { ArticleSummary } from "@/lib/types";

type ArticleFeedProps = {
  articles: ArticleSummary[];
  newsletterInterval?: number;
  adInterval?: number;
  promotionInterval?: number;
};

export function ArticleFeed({
  articles,
  newsletterInterval = 3,
  adInterval = 0,
  promotionInterval = 0
}: ArticleFeedProps) {
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
