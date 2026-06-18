import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import type { EnrichmentPublicContext } from "@/lib/enrichment-public-context";
import type { BrandedImageCallout } from "@/lib/branded-result-image/types";
import { safeTrim } from "@/lib/safe-string";

function extractRatingHint(opportunitySignal: string, gbpSignal: string) {
  const haystack = `${opportunitySignal} ${gbpSignal}`;
  const match = haystack.match(/(\d(?:\.\d)?)\s*(?:★|stars?)/i);
  return match?.[1] ?? null;
}

function extractReviewHint(opportunitySignal: string, gbpSignal: string) {
  const haystack = `${opportunitySignal} ${gbpSignal}`;
  const match = haystack.match(/(\d{2,})\+?\s*reviews?/i);
  return match?.[1] ?? null;
}

function trimCallout(text: unknown, maxLength = 44) {
  const normalized = safeTrim(text).replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function withLeadEmoji(text: unknown, emoji: string) {
  const trimmed = safeTrim(text);
  if (!trimmed) {
    return emoji;
  }

  return /^[\p{Extended_Pictographic}]/u.test(trimmed) ? trimmed : `${emoji} ${trimmed}`;
}

export function buildAttentionHooks(
  enrichment: CachedEnrichmentPayload,
  publicContext: EnrichmentPublicContext
) {
  const opportunitySignal = safeTrim(
    enrichment.opportunity_signal,
    "Check the gap before you pitch."
  );
  const pitchAngle = safeTrim(enrichment.pitch_angle, "Local opportunity");
  const gbpSignal = safeTrim(enrichment.gbp_profile_signal);
  const rating = extractRatingHint(opportunitySignal, gbpSignal);
  const reviews = extractReviewHint(opportunitySignal, gbpSignal);
  const competitors =
    typeof enrichment.competitor_density_1mi === "number"
      ? enrichment.competitor_density_1mi
      : 0;
  const category = safeTrim(publicContext.business_category_singular, "local business");
  const categoryLabel = safeTrim(publicContext.business_category_label, "Local businesses");
  const areaLabel = safeTrim(publicContext.area_label, "this trade area");
  const areaPhrase = (() => {
    const trimmed = safeTrim(publicContext.area_phrase);
    if (!trimmed) {
      return " in this trade area";
    }

    return trimmed.startsWith("in ") ? ` ${trimmed}` : ` in ${trimmed}`;
  })();
  const callouts: BrandedImageCallout[] = [];

  let hookQuestion = `🔍 ${categoryLabel}${areaPhrase} — what's the gap?`;

  if (!enrichment.website_reachable && reviews) {
    hookQuestion = `❓ ${reviews}+ reviews for a ${category}${areaPhrase}… but NO website?`;
  } else if (!enrichment.website_reachable && rating) {
    hookQuestion = `❓ ${rating}★ ${category}${areaPhrase}… but NO website?`;
  } else if (!enrichment.website_reachable) {
    hookQuestion = `🚨 ${categoryLabel}${areaPhrase} — zero reachable website?`;
  } else if (competitors >= 10) {
    hookQuestion = `⚠️ ${competitors} ${categoryLabel.toLowerCase()} within 1 mi${areaPhrase} — who's winning?`;
  } else if (/unclaimed/i.test(gbpSignal)) {
    hookQuestion = `📍 Unclaimed Google profile for a ${category}${areaPhrase}?`;
  } else if (!enrichment.active_social) {
    hookQuestion = `📱 ${categoryLabel}${areaPhrase} — website up, social missing?`;
  } else if (rating && reviews) {
    hookQuestion = `⭐ ${rating}★ ${category} with ${reviews}+ reviews${areaPhrase} — room to grow?`;
  } else if (competitors >= 6) {
    hookQuestion = `🔥 Crowded ${categoryLabel.toLowerCase()} market${areaPhrase} (${competitors} nearby)`;
  }

  callouts.push({
    emoji: "🏷️",
    text: trimCallout(categoryLabel, 36),
    accent: "info"
  });

  callouts.push({
    emoji: "📍",
    text: trimCallout(areaLabel, 36),
    accent: "neutral"
  });

  callouts.push({
    emoji: enrichment.website_reachable ? "✅" : "❌",
    text: enrichment.website_reachable ? "Website reachable" : "No website found",
    accent: enrichment.website_reachable ? "success" : "danger"
  });

  if (typeof competitors === "number") {
    callouts.push({
      emoji: competitors >= 8 ? "🔥" : "📌",
      text: `${competitors} similar within 1 mi`,
      accent: competitors >= 8 ? "warning" : "info"
    });
  }

  if (rating) {
    callouts.push({
      emoji: "⭐",
      text: `${rating}★ Google rating`,
      accent: "success"
    });
  } else if (reviews) {
    callouts.push({
      emoji: "💬",
      text: `${reviews}+ reviews`,
      accent: "info"
    });
  }

  if (callouts.length < 5) {
    callouts.push({
      emoji: enrichment.active_social ? "🔗" : "📵",
      text: enrichment.active_social ? "Social links found" : "No active social",
      accent: enrichment.active_social ? "success" : "warning"
    });
  }

  if (gbpSignal && callouts.length < 6) {
    callouts.push({
      emoji: /unclaimed/i.test(gbpSignal) ? "🚨" : "📋",
      text: trimCallout(gbpSignal),
      accent: /unclaimed/i.test(gbpSignal) ? "danger" : "neutral"
    });
  }

  const punchLine = withLeadEmoji(
    opportunitySignal.length > 96 ? `${opportunitySignal.slice(0, 93).trim()}…` : opportunitySignal,
    "💡"
  );

  return {
    hook_question: hookQuestion,
    punch_line: punchLine,
    callouts: callouts.slice(0, 4),
    badge_label: trimCallout(pitchAngle, 32),
    business_category_label: categoryLabel,
    area_label: areaLabel
  };
}

export function buildAttentionHooksFromPayload(
  payload: {
    website_reachable?: boolean;
    competitor_density_1mi?: number;
    active_social?: boolean;
    opportunity_signal?: string;
    pitch_angle?: string;
    gbp_profile_signal?: string;
    business_category_label?: string;
    business_category_singular?: string;
    area_label?: string;
    area_phrase?: string;
  },
  publicContext?: EnrichmentPublicContext
) {
  const context =
    publicContext ??
    ({
      business_category_label: safeTrim(payload.business_category_label, "Local businesses"),
      business_category_singular: safeTrim(
        payload.business_category_singular,
        "local business"
      ),
      area_label: safeTrim(payload.area_label, "this trade area"),
      area_phrase: safeTrim(payload.area_phrase, " in this trade area")
    } satisfies EnrichmentPublicContext);

  return buildAttentionHooks(
    {
      pitch_angle: String(payload.pitch_angle ?? "Local opportunity"),
      opportunity_signal: String(payload.opportunity_signal ?? "Check the gap before you pitch."),
      business_opportunity_summary: "",
      gbp_profile_signal: String(payload.gbp_profile_signal ?? ""),
      competitor_density_1mi: payload.competitor_density_1mi ?? 0,
      website_reachable: payload.website_reachable ?? false,
      active_social: payload.active_social ?? false
    } as CachedEnrichmentPayload,
    context
  );
}
