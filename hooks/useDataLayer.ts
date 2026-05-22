"use client";

import { useCallback } from "react";

type PublisherEventName =
  | "page_view"
  | "article_read_50_percent"
  | "ad_click"
  | "newsletter_signup"
  | "promotion_click";

type DataLayerEvent = {
  event: PublisherEventName;
  article_id?: string;
  article_slug?: string;
  category?: string;
  ad_slot?: string;
  page_path?: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

export function useDataLayer() {
  return useCallback((event: DataLayerEvent) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(event);
  }, []);
}
