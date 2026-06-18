import { pickBrandedImageTheme } from "@/lib/branded-result-image/pick-theme";
import type {
  BrandedImageCallout,
  BrandedImageCalloutAccent,
  BrandedResultImageInput
} from "@/lib/branded-result-image/types";
import { BRANDED_IMAGE_THEME_IDS } from "@/lib/branded-result-image/themes";
import { safeTrim } from "@/lib/safe-string";

const DEFAULT_CALLOUTS: BrandedImageCallout[] = [
  { emoji: "🔍", text: "Local opportunity signal", accent: "info" },
  { emoji: "📍", text: "Trade area scan", accent: "neutral" }
];

function normalizeAccent(accent: unknown): BrandedImageCalloutAccent {
  if (
    accent === "danger" ||
    accent === "warning" ||
    accent === "success" ||
    accent === "info" ||
    accent === "neutral"
  ) {
    return accent;
  }

  return "neutral";
}

function normalizeCallouts(callouts: BrandedImageCallout[] | null | undefined) {
  const normalized = (callouts ?? [])
    .map((callout) => ({
      emoji: safeTrim(callout?.emoji, "📌"),
      text: safeTrim(callout?.text),
      accent: normalizeAccent(callout?.accent)
    }))
    .filter((callout) => callout.text.length > 0);

  return normalized.length > 0 ? normalized.slice(0, 4) : DEFAULT_CALLOUTS;
}

function normalizeThemeId(themeId: unknown): BrandedResultImageInput["themeId"] {
  if (
    typeof themeId === "string" &&
    BRANDED_IMAGE_THEME_IDS.includes(themeId as BrandedResultImageInput["themeId"])
  ) {
    return themeId as BrandedResultImageInput["themeId"];
  }

  return pickBrandedImageTheme("default-branded-image");
}

export function sanitizeBrandedImageInput(
  input: BrandedResultImageInput
): BrandedResultImageInput {
  return {
    hook_question: safeTrim(input.hook_question, "🔍 What's the local opportunity gap?"),
    punch_line: safeTrim(input.punch_line, "💡 Check the gap before you pitch."),
    badge_label: safeTrim(input.badge_label, "Local opportunity"),
    business_category_label: safeTrim(input.business_category_label, "Local businesses"),
    area_label: safeTrim(input.area_label, "this trade area"),
    callouts: normalizeCallouts(input.callouts),
    themeId: normalizeThemeId(input.themeId)
  };
}
