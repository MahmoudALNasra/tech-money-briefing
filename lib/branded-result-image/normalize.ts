import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import {
  buildAttentionHooks,
  buildAttentionHooksFromPayload
} from "@/lib/branded-result-image/hooks";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";

export function brandedImageInputFromEnrichment(
  enrichment: CachedEnrichmentPayload
): BrandedResultImageInput {
  return buildAttentionHooks(enrichment);
}

export function brandedImageInputFromSocialPayload(payload: {
  pitch_angle?: string;
  opportunity_signal?: string;
  gbp_profile_signal?: string;
  competitor_density_1mi?: number;
  website_reachable?: boolean;
  active_social?: boolean;
}): BrandedResultImageInput {
  return buildAttentionHooksFromPayload(payload);
}
