export const CORE_CATEGORIES = [
  "ai-tools",
  "digital-marketing",
  "seo",
  "ecommerce",
  "startups",
  "fintech",
  "creator-business"
] as const;

export type CoreCategory = (typeof CORE_CATEGORIES)[number];

export function isCoreCategory(category: string): category is CoreCategory {
  return CORE_CATEGORIES.includes(category as CoreCategory);
}
