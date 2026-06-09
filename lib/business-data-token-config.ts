export const TOKEN_COSTS = {
  /** Legacy env name; 1 credit = 1 processed business in the UI. */
  fullExport: Number(process.env.BUSINESS_DATA_FULL_EXPORT_TOKENS ?? "1"),
  driveUpload: Number(process.env.BUSINESS_DATA_DRIVE_UPLOAD_TOKENS ?? "0"),
  previewSearch: 0
} as const;

export const BUSINESS_DATA_REPORT_LIMITS = {
  min: 5,
  default: 10,
  max: Math.min(
    Math.max(Number(process.env.BUSINESS_DATA_EXPORT_MAX_RESULTS ?? "60"), 5),
    60
  )
} as const;

export function clampBusinessDataReportLimit(value: unknown, maxAvailable?: number) {
  const requested = Number(value);
  const cappedMax =
    maxAvailable !== undefined
      ? Math.min(BUSINESS_DATA_REPORT_LIMITS.max, Math.max(Math.round(maxAvailable), 1))
      : BUSINESS_DATA_REPORT_LIMITS.max;
  const floor =
    cappedMax < BUSINESS_DATA_REPORT_LIMITS.min
      ? 1
      : BUSINESS_DATA_REPORT_LIMITS.min;

  if (!Number.isFinite(requested)) {
    return Math.min(
      maxAvailable !== undefined
        ? Math.min(BUSINESS_DATA_REPORT_LIMITS.default, cappedMax)
        : BUSINESS_DATA_REPORT_LIMITS.default,
      cappedMax
    );
  }

  return Math.min(Math.max(Math.round(requested), Math.min(floor, cappedMax)), cappedMax);
}

/** One business credit is charged per successfully processed business. */
export function getBusinessDataExportTokenCost(resultLimit: number) {
  return clampBusinessDataReportLimit(resultLimit);
}

export const getBusinessDataExportCreditCost = getBusinessDataExportTokenCost;

export const SUBSCRIPTION_TOKEN_GRANT = Number(
  process.env.BUSINESS_DATA_SUBSCRIPTION_TOKENS ??
    process.env.NEXT_PUBLIC_BUSINESS_DATA_SUBSCRIPTION_TOKENS ??
    "150"
);

export const SUBSCRIPTION_CREDIT_GRANT = SUBSCRIPTION_TOKEN_GRANT;

export const SUBSCRIPTION_PRICE_USD = Number(
  process.env.BUSINESS_DATA_SUBSCRIPTION_PRICE_USD ??
    process.env.NEXT_PUBLIC_BUSINESS_DATA_PRICE ??
    "9.99"
);

export type BusinessDataCreditBundleId = "starter" | "growth" | "agency";

export const BUSINESS_DATA_CREDIT_BUNDLES: Record<
  BusinessDataCreditBundleId,
  {
    id: BusinessDataCreditBundleId;
    name: string;
    priceUsd: number;
    credits: number;
    stripePriceEnv: string;
    description: string;
  }
> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceUsd: Number(process.env.BUSINESS_DATA_STARTER_PRICE_USD ?? "9.99"),
    credits: Number(process.env.BUSINESS_DATA_STARTER_CREDITS ?? "150"),
    stripePriceEnv: "STRIPE_BUSINESS_DATA_STARTER_PRICE_ID",
    description: "Test one market or niche."
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceUsd: Number(process.env.BUSINESS_DATA_GROWTH_PRICE_USD ?? "19.99"),
    credits: Number(process.env.BUSINESS_DATA_GROWTH_CREDITS ?? "350"),
    stripePriceEnv: "STRIPE_BUSINESS_DATA_GROWTH_PRICE_ID",
    description: "Build lead lists more often."
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceUsd: Number(process.env.BUSINESS_DATA_AGENCY_PRICE_USD ?? "50"),
    credits: Number(process.env.BUSINESS_DATA_AGENCY_CREDITS ?? "850"),
    stripePriceEnv: "STRIPE_BUSINESS_DATA_AGENCY_PRICE_ID",
    description: "Run larger prospecting campaigns."
  }
};

export const DEFAULT_BUSINESS_DATA_CREDIT_BUNDLE = BUSINESS_DATA_CREDIT_BUNDLES.starter;

export function getBusinessDataCreditBundle(value: unknown) {
  const id = String(value ?? "").trim() as BusinessDataCreditBundleId;
  return BUSINESS_DATA_CREDIT_BUNDLES[id] ?? DEFAULT_BUSINESS_DATA_CREDIT_BUNDLE;
}
