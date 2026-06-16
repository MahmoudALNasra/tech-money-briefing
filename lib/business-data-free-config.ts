/** Lifetime free enriched search runs per account (replaces daily preview cap). */
export const FREE_LIFETIME_RUNS = Number(process.env.FREE_LIFETIME_RUNS ?? "3");

/** Businesses fully enriched per free search run. */
export const FREE_RUN_ENRICHED_COUNT = Number(process.env.FREE_RUN_ENRICHED_COUNT ?? "3");

/** Days before cached enrichment is considered stale and re-enriched. */
export const ENRICHMENT_CACHE_TTL_DAYS = Number(
  process.env.ENRICHMENT_CACHE_TTL_DAYS ?? "45"
);

export const FREE_RADIUS_LIMIT_METERS = 1609;

export const SUBSCRIBER_MAX_RADIUS_METERS = 8047;

/** Paid sample enrichment pull size (Tier 2 filter unlock). */
export const SAMPLE_ENRICH_SIZE = Number(process.env.SAMPLE_ENRICH_SIZE ?? "15");

export const SAMPLE_ENRICH_SIZE_PUBLIC = Number(
  process.env.NEXT_PUBLIC_SAMPLE_ENRICH_SIZE ?? process.env.SAMPLE_ENRICH_SIZE ?? "15"
);
