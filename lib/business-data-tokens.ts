import { supabase } from "@/lib/supabase";

export {
  BUSINESS_DATA_CREDIT_BUNDLES,
  BUSINESS_DATA_REPORT_LIMITS,
  DEFAULT_BUSINESS_DATA_CREDIT_BUNDLE,
  SUBSCRIPTION_CREDIT_GRANT,
  SUBSCRIPTION_PRICE_USD,
  SUBSCRIPTION_TOKEN_GRANT,
  TOKEN_COSTS,
  getBusinessDataCreditBundle,
  clampBusinessDataReportLimit,
  getBusinessDataExportCreditCost,
  getBusinessDataExportTokenCost
} from "@/lib/business-data-token-config";

/** Estimated USD cost per action for margin reporting */
export const ESTIMATED_COSTS_USD = {
  previewSearch: 0.015,
  fullExport: 0.35,
  driveUpload: 0.01,
  placesAutocomplete: 0.005
} as const;

type WalletRow = {
  user_id: string;
  balance: number;
  lifetime_credited: number;
  lifetime_debited: number;
};
export async function getOrCreateWallet(userId: string): Promise<WalletRow> {
  const { data: existing, error: readError } = await supabase
    .from("business_data_wallets")
    .select("user_id, balance, lifetime_credited, lifetime_debited")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (existing) {
    return existing as WalletRow;
  }

  const { data: created, error: insertError } = await supabase
    .from("business_data_wallets")
    .insert({ user_id: userId, balance: 0 })
    .select("user_id, balance, lifetime_credited, lifetime_debited")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return created as WalletRow;
}

export async function getWalletBalance(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
}

export async function creditTokens(input: {
  userId: string;
  amount: number;
  reason: string;
  stripeSessionId?: string;
  stripeEventId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (input.amount <= 0) {
    throw new Error("Credit amount must be positive.");
  }

  if (input.stripeSessionId) {
    const { data: existing } = await supabase
      .from("business_data_token_ledger")
      .select("id")
      .eq("stripe_session_id", input.stripeSessionId)
      .maybeSingle();

    if (existing) {
      return { alreadyProcessed: true as const };
    }
  }

  if (input.stripeEventId) {
    const { data: existing } = await supabase
      .from("business_data_token_ledger")
      .select("id")
      .eq("stripe_event_id", input.stripeEventId)
      .maybeSingle();

    if (existing) {
      return { alreadyProcessed: true as const };
    }
  }

  const wallet = await getOrCreateWallet(input.userId);
  const nextBalance = wallet.balance + input.amount;

  const { error: walletError } = await supabase
    .from("business_data_wallets")
    .update({
      balance: nextBalance,
      lifetime_credited: wallet.lifetime_credited + input.amount,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", input.userId);

  if (walletError) {
    throw new Error(walletError.message);
  }

  const { error: ledgerError } = await supabase.from("business_data_token_ledger").insert({
    user_id: input.userId,
    delta: input.amount,
    balance_after: nextBalance,
    reason: input.reason,
    stripe_session_id: input.stripeSessionId ?? null,
    stripe_event_id: input.stripeEventId ?? null,
    metadata: input.metadata ?? {}
  });

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  return { alreadyProcessed: false as const, balance: nextBalance };
}

export async function debitTokens(input: {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  if (input.amount <= 0) {
    throw new Error("Debit amount must be positive.");
  }

  const wallet = await getOrCreateWallet(input.userId);

  if (wallet.balance < input.amount) {
    return { ok: false as const, balance: wallet.balance };
  }

  const nextBalance = wallet.balance - input.amount;

  const { error: walletError } = await supabase
    .from("business_data_wallets")
    .update({
      balance: nextBalance,
      lifetime_debited: wallet.lifetime_debited + input.amount,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", input.userId)
    .gte("balance", input.amount);

  if (walletError) {
    throw new Error(walletError.message);
  }

  const { error: ledgerError } = await supabase.from("business_data_token_ledger").insert({
    user_id: input.userId,
    delta: -input.amount,
    balance_after: nextBalance,
    reason: input.reason,
    metadata: input.metadata ?? {}
  });

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  return { ok: true as const, balance: nextBalance };
}

export async function logUsageEvent(input: {
  userId?: string | null;
  sessionKey?: string | null;
  eventType: string;
  tokensCharged?: number;
  estimatedCostUsd?: number;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("business_data_usage_events").insert({
    user_id: input.userId ?? null,
    session_key: input.sessionKey ?? null,
    event_type: input.eventType,
    tokens_charged: input.tokensCharged ?? 0,
    estimated_cost_usd: input.estimatedCostUsd ?? 0,
    metadata: input.metadata ?? {}
  });

  if (error) {
    console.error("[business-data-usage]", error.message);
  }
}

export async function getRecentLedger(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("business_data_token_ledger")
    .select("delta, balance_after, reason, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
