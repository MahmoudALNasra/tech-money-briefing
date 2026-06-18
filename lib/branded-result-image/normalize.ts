import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import {
  buildAttentionHooks,
  buildAttentionHooksFromPayload
} from "@/lib/branded-result-image/hooks";
import { pickBrandedImageTheme } from "@/lib/branded-result-image/pick-theme";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";
import type { EnrichmentPublicContext } from "@/lib/enrichment-public-context";
import { safeTrim } from "@/lib/safe-string";

function withTheme(
  input: Omit<BrandedResultImageInput, "themeId">,
  themeSeed?: string
): BrandedResultImageInput {
  const seed =
    themeSeed ??
    `${input.hook_question}|${input.business_category_label}|${input.area_label}|${input.badge_label}`;

  return {
    ...input,
    themeId: pickBrandedImageTheme(seed)
  };
}

export function brandedImageInputFromEnrichment(
  enrichment: CachedEnrichmentPayload,
  publicContext: EnrichmentPublicContext,
  themeSeed?: string
): BrandedResultImageInput {
  return withTheme(buildAttentionHooks(enrichment, publicContext), themeSeed);
}

export function brandedImageInputFromSocialPayload(
  payload: {
    hook_question?: string;
    punch_line?: string;
    badge_label?: string;
    pitch_angle?: string;
    opportunity_signal?: string;
    gbp_profile_signal?: string;
    competitor_density_1mi?: number;
    website_reachable?: boolean;
    active_social?: boolean;
    business_category_label?: string;
    business_category_singular?: string;
    area_label?: string;
    area_phrase?: string;
  },
  themeSeed?: string
): BrandedResultImageInput {
  const hooks = buildAttentionHooksFromPayload(payload);

  return withTheme(
    {
      hook_question: safeTrim(payload.hook_question) || hooks.hook_question,
      punch_line: safeTrim(payload.punch_line) || hooks.punch_line,
      badge_label: safeTrim(payload.badge_label) || hooks.badge_label,
      business_category_label:
        safeTrim(payload.business_category_label) || hooks.business_category_label,
      area_label: safeTrim(payload.area_label) || hooks.area_label,
      callouts: hooks.callouts
    },
    themeSeed
  );
}
