export type BrandedResultImageInput = {
  headline: string;
  pitch_angle: string;
  opportunity_signal: string;
  summary_line: string;
  gbp_profile_signal?: string;
  competitor_density_1mi?: number;
  website_reachable?: boolean;
  active_social?: boolean;
};

export type BrandedResultImageVariant = "square" | "landscape";

export type BrandedResultImageVariants = {
  square: {
    contentType: "image/png";
    base64: string;
    width: number;
    height: number;
  };
  landscape: {
    contentType: "image/png";
    base64: string;
    width: number;
    height: number;
  };
};

export const BRANDED_IMAGE_SQUARE_SIZE = { width: 1080, height: 1080 } as const;
export const BRANDED_IMAGE_LANDSCAPE_SIZE = { width: 1200, height: 630 } as const;
