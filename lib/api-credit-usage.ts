import { supabase } from "@/lib/supabase";

type ApiCreditAccount = {
  provider: string;
  keyConfigured: boolean;
  creditLimit: number | null;
  creditsUsed: number;
  creditsUsedLast24h: number;
  estimatedRemaining: number | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  status: "ok" | "warning" | "danger" | "missing";
  notes: string[];
};

const serperEventTypes = ["serper_search", "serper_images"];

function parseIntegerEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseDateEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function daysUntil(date: Date | null) {
  if (!date) {
    return null;
  }

  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function statusFor(input: {
  keyConfigured: boolean;
  creditLimit: number | null;
  estimatedRemaining: number | null;
  daysUntilExpiry: number | null;
}) {
  if (!input.keyConfigured) {
    return "missing" as const;
  }

  const remainingPct =
    input.creditLimit && input.estimatedRemaining !== null
      ? input.estimatedRemaining / input.creditLimit
      : null;

  if (
    (input.daysUntilExpiry !== null && input.daysUntilExpiry <= 7) ||
    (remainingPct !== null && remainingPct <= 0.1)
  ) {
    return "danger" as const;
  }

  if (
    (input.daysUntilExpiry !== null && input.daysUntilExpiry <= 30) ||
    (remainingPct !== null && remainingPct <= 0.25)
  ) {
    return "warning" as const;
  }

  return "ok" as const;
}

async function sumSerperCreditsUsed(since?: string) {
  let query = supabase
    .from("business_data_usage_events")
    .select("tokens_charged")
    .in("event_type", serperEventTypes)
    .limit(10000);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce(
    (sum, row) => sum + Math.max(0, Number(row.tokens_charged ?? 0)),
    0
  );
}

export async function getApiCreditUsage(): Promise<ApiCreditAccount[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [trackedUsed, trackedUsedLast24h] = await Promise.all([
    sumSerperCreditsUsed(),
    sumSerperCreditsUsed(twentyFourHoursAgo)
  ]);

  const creditLimit = parseIntegerEnv("SERPER_CREDITS_TOTAL");
  const usageOffset = parseIntegerEnv("SERPER_CREDITS_USED_OFFSET") ?? 0;
  const explicitExpiry = parseDateEnv("SERPER_CREDITS_EXPIRES_AT");
  const purchasedAt = parseDateEnv("SERPER_CREDITS_PURCHASED_AT");
  const expiresAt = explicitExpiry ?? (purchasedAt ? addMonths(purchasedAt, 6) : null);
  const creditsUsed = usageOffset + trackedUsed;
  const estimatedRemaining = creditLimit === null ? null : Math.max(creditLimit - creditsUsed, 0);
  const daysUntilExpiry = daysUntil(expiresAt);
  const keyConfigured = Boolean(process.env.SERPER_API_KEY?.trim());
  const notes: string[] = [];

  if (creditLimit === null) {
    notes.push("Set SERPER_CREDITS_TOTAL to show estimated remaining credits.");
  }

  if (!expiresAt) {
    notes.push("Set SERPER_CREDITS_EXPIRES_AT or SERPER_CREDITS_PURCHASED_AT for renewal alerts.");
  }

  if (usageOffset > 0) {
    notes.push("Includes a manual usage offset for credits spent before dashboard tracking.");
  }

  return [
    {
      provider: "Serper",
      keyConfigured,
      creditLimit,
      creditsUsed,
      creditsUsedLast24h: trackedUsedLast24h,
      estimatedRemaining,
      expiresAt: expiresAt?.toISOString() ?? null,
      daysUntilExpiry,
      status: statusFor({ keyConfigured, creditLimit, estimatedRemaining, daysUntilExpiry }),
      notes
    }
  ];
}
