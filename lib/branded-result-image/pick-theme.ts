import { createHash } from "node:crypto";

import {
  BRANDED_IMAGE_THEME_IDS,
  type BrandedImageThemeId
} from "@/lib/branded-result-image/themes";

export function pickBrandedImageTheme(seed: string): BrandedImageThemeId {
  const hash = createHash("sha1").update(seed).digest();
  const index = hash[0] % BRANDED_IMAGE_THEME_IDS.length;
  return BRANDED_IMAGE_THEME_IDS[index];
}
