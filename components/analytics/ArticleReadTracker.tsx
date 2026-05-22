"use client";

import { useEffect, useRef } from "react";

import { useDataLayer } from "@/hooks/useDataLayer";

type ArticleReadTrackerProps = {
  articleId: string;
  slug: string;
  category: string;
};

export function ArticleReadTracker({
  articleId,
  slug,
  category
}: ArticleReadTrackerProps) {
  const pushToDataLayer = useDataLayer();
  const sentHalfRead = useRef(false);

  useEffect(() => {
    pushToDataLayer({
      event: "page_view",
      article_id: articleId,
      article_slug: slug,
      category,
      page_path: window.location.pathname
    });

    const onScroll = () => {
      if (sentHalfRead.current) {
        return;
      }

      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const progress = (scrollTop + viewportHeight) / documentHeight;

      if (progress >= 0.5) {
        sentHalfRead.current = true;
        pushToDataLayer({
          event: "article_read_50_percent",
          article_id: articleId,
          article_slug: slug,
          category
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [articleId, category, pushToDataLayer, slug]);

  return null;
}
