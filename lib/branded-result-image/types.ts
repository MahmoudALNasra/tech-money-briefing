import type { BrandedImageThemeId } from "@/lib/branded-result-image/themes";

export type { BrandedImageThemeId } from "@/lib/branded-result-image/themes";

export type BrandedImageCalloutAccent = "danger" | "warning" | "success" | "info" | "neutral";

export type BrandedImageCallout = {
  emoji: string;
  text: string;
  accent: BrandedImageCalloutAccent;
};

export type BrandedResultImageInput = {
  hook_question: string;
  punch_line: string;
  callouts: BrandedImageCallout[];
  badge_label: string;
  themeId: BrandedImageThemeId;
};

export type BrandedResultImageVariant = "square" | "landscape";

export type BrandedResultImageVariantEntry = {
  contentType: "image/png";
  base64: string;
  width: number;
  height: number;
  publicPath?: string;
};

export type BrandedResultImageVariants = {
  square: BrandedResultImageVariantEntry;
  landscape: BrandedResultImageVariantEntry;
};

export const BRANDED_IMAGE_SQUARE_SIZE = { width: 1080, height: 1080 } as const;
export const BRANDED_IMAGE_LANDSCAPE_SIZE = { width: 1200, height: 630 } as const;

export function brandedImageVariantPublicUrl(
  variants: BrandedResultImageVariants | null | undefined,
  variant: BrandedResultImageVariant,
  absoluteUrl: (path: string) => string
) {
  const publicPath = variants?.[variant]?.publicPath;

  if (!publicPath) {
    return null;
  }

  return absoluteUrl(publicPath);
}
