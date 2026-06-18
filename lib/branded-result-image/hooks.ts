import type { CachedEnrichmentPayload } from "@/lib/business-data-enrichment-cache";
import type { BrandedImageCallout } from "@/lib/branded-result-image/types";

function extractRatingHint(enrichment: CachedEnrichmentPayload) {
  const haystack = `${enrichment.opportunity_signal} ${enrichment.gbp_profile_signal}`;
  const match = haystack.match(/(\d(?:\.\d)?)\s*(?:★|stars?)/i);
  return match?.[1] ?? null;
}

function extractReviewHint(enrichment: CachedEnrichmentPayload) {
  const haystack = `${enrichment.opportunity_signal} ${enrichment.gbp_profile_signal}`;
  const match = haystack.match(/(\d{2,})\+?\s*reviews?/i);
  return match?.[1] ?? null;
}

function trimCallout(text: string, maxLength = 44) {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function withLeadEmoji(text: string, emoji: string) {
  const trimmed = text.trim();
  return /^[\p{Extended_Pictographic}]/u.test(trimmed) ? trimmed : `${emoji} ${trimmed}`;
}

export function buildAttentionHooks(enrichment: CachedEnrichmentPayload) {
  const rating = extractRatingHint(enrichment);
  const reviews = extractReviewHint(enrichment);
  const competitors = enrichment.competitor_density_1mi;
  const gbpSignal = enrichment.gbp_profile_signal.trim();
  const callouts: BrandedImageCallout[] = [];

  let hookQuestion = "🔍 Real /leads scan — what's the gap?";

  if (!enrichment.website_reachable && reviews) {
    hookQuestion = `❓ ${reviews}+ Google reviews… but NO website?`;
  } else if (!enrichment.website_reachable && rating) {
    hookQuestion = `❓ ${rating}★ rating… but NO website?`;
  } else if (!enrichment.website_reachable) {
    hookQuestion = "🚨 Local business found — zero reachable website?";
  } else if (competitors >= 10) {
    hookQuestion = `⚠️ ${competitors} rivals within 1 mile — who's winning?`;
  } else if (/unclaimed/i.test(gbpSignal)) {
    hookQuestion = "📍 Unclaimed Google profile — easy win?";
  } else if (!enrichment.active_social) {
    hookQuestion = "📱 Website's up… but social links missing?";
  } else if (rating && reviews) {
    hookQuestion = `⭐ ${rating}★ & ${reviews}+ reviews — still room to grow?`;
  } else if (competitors >= 6) {
    hookQuestion = `🔥 Crowded market (${competitors} nearby) — who gets the click?`;
  }

  callouts.push({
    emoji: enrichment.website_reachable ? "✅" : "❌",
    text: enrichment.website_reachable ? "Website reachable" : "No website found",
    accent: enrichment.website_reachable ? "success" : "danger"
  });

  if (typeof competitors === "number") {
    callouts.push({
      emoji: competitors >= 8 ? "🔥" : "📍",
      text: `${competitors} similar businesses within 1 mi`,
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

  callouts.push({
    emoji: enrichment.active_social ? "🔗" : "📵",
    text: enrichment.active_social ? "Social links found" : "No active social",
    accent: enrichment.active_social ? "success" : "warning"
  });

  if (gbpSignal && callouts.length < 4) {
    callouts.push({
      emoji: /unclaimed/i.test(gbpSignal) ? "🚨" : "📋",
      text: trimCallout(gbpSignal),
      accent: /unclaimed/i.test(gbpSignal) ? "danger" : "neutral"
    });
  }

  const opportunity = enrichment.opportunity_signal.trim();
  const punchLine = withLeadEmoji(
    opportunity.length > 96 ? `${opportunity.slice(0, 93).trim()}…` : opportunity,
    "💡"
  );

  return {
    hook_question: hookQuestion,
    punch_line: punchLine,
    callouts: callouts.slice(0, 4),
    badge_label: trimCallout(enrichment.pitch_angle.trim(), 32)
  };
}

export function buildAttentionHooksFromPayload(payload: {
  website_reachable?: boolean;
  competitor_density_1mi?: number;
  active_social?: boolean;
  opportunity_signal?: string;
  pitch_angle?: string;
  gbp_profile_signal?: string;
}) {
  return buildAttentionHooks({
    pitch_angle: String(payload.pitch_angle ?? "Local opportunity"),
    opportunity_signal: String(payload.opportunity_signal ?? "Check the gap before you pitch."),
    business_opportunity_summary: "",
    gbp_profile_signal: String(payload.gbp_profile_signal ?? ""),
    competitor_density_1mi: payload.competitor_density_1mi ?? 0,
    website_reachable: payload.website_reachable ?? false,
    active_social: payload.active_social ?? false
  } as CachedEnrichmentPayload);
}
