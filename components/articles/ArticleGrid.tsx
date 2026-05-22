import { Fragment } from "react";

import { NativeAdCard } from "@/components/ads/NativeAdCard";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";
import type { ArticleSummary } from "@/lib/types";

type ArticleGridProps = {
  articles: ArticleSummary[];
  adInterval?: number;
  newsletterInterval?: number;
};

export function ArticleGrid({
  articles,
  adInterval = 6,
  newsletterInterval = 4
}: ArticleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, index) => {
        const shouldInjectAd =
          adInterval > 0 && (index + 1) % adInterval === 0;
        const adSlotIndex = Math.floor((index + 1) / adInterval);
        const shouldInjectNewsletter =
          newsletterInterval > 0 && (index + 1) % newsletterInterval === 0;
        const newsletterSlotIndex = Math.floor(
          (index + 1) / newsletterInterval
        );

        return (
          <Fragment key={article.id}>
            <ArticleCard article={article} priority={index < 4} />
            {shouldInjectNewsletter ? (
              <NewsletterCapture placementIndex={newsletterSlotIndex} />
            ) : null}
            {shouldInjectAd ? (
              <NativeAdCard slotIndex={adSlotIndex} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
