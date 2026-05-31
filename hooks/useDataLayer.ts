"use client";

import { useCallback } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics-client";

type PublisherEventName =
  | "page_view"
  | "article_read_50_percent"
  | "ad_click"
  | "newsletter_signup"
  | "promotion_click"
  | "sponsor_click"
  | "monetization_audit_submit"
  | "tool_assistant_open"
  | "tool_assistant_message"
  | "tool_assistant_prompt_click"
  | "tool_assistant_suggested_tool_click"
  | "contact_form_submit"
  | "advanced_tool_download"
  | "advanced_tool_next_action_click"
  | "human_layer_action_click"
  | "visitor_pathfinder_click"
  | "meme_download"
  | "share_caption_copy"
  | "social_image_download";

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

    if (event.event !== "page_view") {
      trackAnalyticsEvent({
        event: event.event,
        page_path:
          typeof event.page_path === "string"
            ? event.page_path
            : undefined,
        article_id:
          typeof event.article_id === "string" ? event.article_id : undefined,
        article_slug:
          typeof event.article_slug === "string"
            ? event.article_slug
            : undefined,
        category:
          typeof event.category === "string" ? event.category : undefined,
        metadata: Object.fromEntries(
          Object.entries(event).filter(
            ([key]) =>
              ![
                "event",
                "page_path",
                "article_id",
                "article_slug",
                "category"
              ].includes(key)
          )
        )
      });
    }
  }, []);
}
