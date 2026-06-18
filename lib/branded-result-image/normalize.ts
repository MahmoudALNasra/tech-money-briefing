import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import {
  buildAttentionHooks,
  buildAttentionHooksFromPayload
} from "@/lib/branded-result-image/hooks";
import { pickBrandedImageTheme } from "@/lib/branded-result-image/pick-theme";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";
import { safeTrim } from "@/lib/safe-string";

function withTheme(
  input: Omit<BrandedResultImageInput, "themeId">,
  themeSeed?: string
): BrandedResultImageInput {
  const seed = themeSeed ?? `${input.hook_question}|${input.badge_label}|${input.punch_line}`;

  return {
    ...input,
    themeId: pickBrandedImageTheme(seed)
  };
}

export function brandedImageInputFromEnrichment(
  enrichment: CachedEnrichmentPayload,
  themeSeed?: string
): BrandedResultImageInput {
  return withTheme(buildAttentionHooks(enrichment), themeSeed);
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
  },
  themeSeed?: string
): BrandedResultImageInput {
  const hooks = buildAttentionHooksFromPayload(payload);

  return withTheme(
    {
      hook_question: safeTrim(payload.hook_question) || hooks.hook_question,
      punch_line: safeTrim(payload.punch_line) || hooks.punch_line,
      badge_label: safeTrim(payload.badge_label) || hooks.badge_label,
      callouts: hooks.callouts
    },
    themeSeed
  );
}
