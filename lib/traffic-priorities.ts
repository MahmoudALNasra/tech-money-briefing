/**
 * Compare pages with the most GSC impressions (90-day window, Jun 2026).
 * Used to surface high-intent pages on the homepage and compare hub.
 */
export const TOP_COMPARE_SLUGS_BY_GSC = [
  "cloudflare-vs-aws-cloudfront",
  "matomo-vs-google-analytics",
  "snowflake-vs-bigquery",
  "google-analytics-vs-plausible",
  "screaming-frog-vs-sitebulb",
  "google-workspace-vs-zoho",
  "stripe-vs-paddle",
  "beehiiv-vs-substack",
  "cursor-vs-github-copilot",
  "shopify-vs-woocommerce"
] as const;

export type TopCompareSlug = (typeof TOP_COMPARE_SLUGS_BY_GSC)[number];
