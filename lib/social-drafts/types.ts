export const SOCIAL_SOURCE_TYPES = [
  "enrichment_example",
  "aggregate_stat",
  "product_detail",
  "article_link"
] as const;

export type SocialSourceType = (typeof SOCIAL_SOURCE_TYPES)[number];

export type SocialDraftSource =
  | {
      type: "enrichment_example";
      payload: {
        hook_question: string;
        punch_line: string;
        badge_label: string;
        business_category_label: string;
        business_category_singular: string;
        area_label: string;
        area_phrase: string;
        business_descriptor: string;
        gbp_profile_signal: string;
        opportunity_signal: string;
        pitch_angle: string;
        website_reachable: boolean;
        competitor_density_1mi: number;
        active_social?: boolean;
        privacy_note: string;
      };
    }
  | {
      type: "aggregate_stat";
      payload: {
        stat_label: string;
        stat_value: string;
        stat_detail: string;
        sample_size: number;
        insights_url: string;
        sample_note?: string;
      };
    }
  | {
      type: "product_detail";
      payload: {
        topic: string;
        detail: string;
        leads_url: string;
      };
    }
  | {
      type: "article_link";
      payload: {
        title: string;
        url: string;
        meta_description: string;
        connection_to_leads: string;
      };
    };

export type GeneratedSocialDraft = {
  linkedin_draft: string;
  instagram_caption: string;
  instagram_visual_direction: string;
  linkedin_opening: string;
  instagram_opening: string;
  repetition_warning: string | null;
};

import type { BrandedResultImageVariants } from "@/lib/branded-result-image/types";

export type SocialPostDraftRow = {
  id: string;
  run_label: string;
  source_type: SocialSourceType;
  source_payload: Record<string, unknown>;
  linkedin_draft: string;
  instagram_caption: string;
  instagram_visual_direction: string;
  linkedin_opening: string;
  instagram_opening: string;
  repetition_warning: string | null;
  branded_image_variants: BrandedResultImageVariants | null;
  posted_linkedin_at: string | null;
  posted_instagram_at: string | null;
  email_sent_at: string | null;
  created_at: string;
  has_branded_images?: boolean;
  branded_image_square_url?: string | null;
  branded_image_landscape_url?: string | null;
};
