import type { User } from "@supabase/supabase-js";

import { formatAuthProviderLabel } from "@/lib/auth-oauth-providers";
import { buildReportFilename, type ReportJobRow } from "@/lib/business-data-report-jobs";
import {
  creditTokens,
  debitTokens,
  getOrCreateWallet,
  getRecentLedger
} from "@/lib/business-data-tokens";
import { getSupabaseClient } from "@/lib/supabase";

export type AdminUserSummary = {
  id: string;
  email: string;
  provider: string;
  providerLabel: string;
  createdAt: string;
  lastSignInAt: string | null;
  balance: number;
  lifetimeCredited: number;
  lifetimeDebited: number;
};

export type LedgerEntry = {
  id: string;
  delta: number;
  balance_after: number;
  reason: string;
  stripe_session_id: string | null;
  stripe_event_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminActionRow = {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action_type: string;
  credit_delta: number;
  stripe_refund_id: string | null;
  stripe_session_id: string | null;
  ledger_entry_id: string | null;
  report_job_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function resolveUserAuthProvider(user: User) {
  const appProvider = String(user.app_metadata?.provider ?? "").trim();
  if (appProvider && appProvider !== "email") {
    return appProvider;
  }

  const oauthIdentity = user.identities?.find((identity) => identity.provider !== "email");
  return oauthIdentity?.provider ?? "email";
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

async function findUserByEmail(email: string) {
  const supabase = getSupabaseClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

async function getUserById(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

async function getWalletMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, Awaited<ReturnType<typeof getOrCreateWallet>>>();
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("business_data_wallets")
    .select("user_id, balance, lifetime_credited, lifetime_debited")
    .in("user_id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row) => [
      String(row.user_id),
      {
        user_id: String(row.user_id),
        balance: Number(row.balance),
        lifetime_credited: Number(row.lifetime_credited),
        lifetime_debited: Number(row.lifetime_debited)
      }
    ])
  );
}

function mapAdminUser(user: User, wallet?: Awaited<ReturnType<typeof getOrCreateWallet>>): AdminUserSummary {
  const provider = resolveUserAuthProvider(user);

  return {
    id: user.id,
    email: user.email ?? "Unknown",
    provider,
    providerLabel: formatAuthProviderLabel(provider),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    balance: wallet?.balance ?? 0,
    lifetimeCredited: wallet?.lifetime_credited ?? 0,
    lifetimeDebited: wallet?.lifetime_debited ?? 0
  };
}

export async function listAdminUsers(input?: { query?: string; limit?: number }) {
  const supabase = getSupabaseClient();
  const query = input?.query?.trim().toLowerCase() ?? "";
  const limit = Math.min(Math.max(input?.limit ?? 100, 1), 500);
  const users: User[] = [];
  let page = 1;

  while (users.length < limit && page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      throw new Error(error.message);
    }

    users.push(...data.users);

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  const filtered = query
    ? users.filter((user) => user.email?.toLowerCase().includes(query))
    : users;
  const limited = filtered.slice(0, limit);
  const walletMap = await getWalletMap(limited.map((user) => user.id));

  return limited.map((user) => mapAdminUser(user, walletMap.get(user.id)));
}

export async function getAdminUserDetail(userId: string) {
  const user = await getUserById(userId);
  const wallet = await getOrCreateWallet(userId);
  const supabase = getSupabaseClient();

  const [ledgerResult, usageResult, reportResult, adminActionsResult] = await Promise.all([
    supabase
      .from("business_data_token_ledger")
      .select("id, delta, balance_after, reason, stripe_session_id, stripe_event_id, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("business_data_usage_events")
      .select("id, event_type, tokens_charged, estimated_cost_usd, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("business_data_report_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("business_data_admin_actions")
      .select("*")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  if (ledgerResult.error) {
    throw new Error(ledgerResult.error.message);
  }

  if (usageResult.error) {
    throw new Error(usageResult.error.message);
  }

  if (reportResult.error) {
    throw new Error(reportResult.error.message);
  }

  if (adminActionsResult.error) {
    throw new Error(adminActionsResult.error.message);
  }

  const reportJobs = (reportResult.data ?? []).map((row) => {
    const job = row as Record<string, unknown>;
    const query = (job.query ?? {}) as ReportJobRow["query"];

    return {
      id: String(job.id),
      status: String(job.status),
      requestedCount: Number(job.requested_count),
      processedCount: Number(job.processed_count),
      chargedCredits: Number(job.charged_credits),
      location: query.center?.label || query.location || "Unknown location",
      category: query.category,
      createdAt: String(job.created_at),
      filename: buildReportFilename({
        query,
        requested_count: Number(job.requested_count),
        processed_count: Number(job.processed_count)
      } as ReportJobRow)
    };
  });

  const refundedReportIds = new Set(
    (adminActionsResult.data ?? [])
      .filter((row) => row.action_type === "operation_credit_refund" && row.report_job_id)
      .map((row) => String(row.report_job_id))
  );

  const refundedLedgerIds = new Set(
    (adminActionsResult.data ?? [])
      .filter((row) => row.action_type === "stripe_refund" && row.ledger_entry_id)
      .map((row) => String(row.ledger_entry_id))
  );

  return {
    user: mapAdminUser(user, wallet),
    wallet: {
      balance: wallet.balance,
      lifetimeCredited: wallet.lifetime_credited,
      lifetimeDebited: wallet.lifetime_debited
    },
    ledger: (ledgerResult.data ?? []) as LedgerEntry[],
    usageEvents: usageResult.data ?? [],
    reportJobs: reportJobs.map((job) => ({
      ...job,
      creditRefundAvailable:
        job.chargedCredits > 0 && !refundedReportIds.has(job.id)
    })),
    adminActions: (adminActionsResult.data ?? []) as AdminActionRow[],
    stripePurchases: ((ledgerResult.data ?? []) as LedgerEntry[])
      .filter((entry) => entry.delta > 0 && entry.stripe_session_id)
      .map((entry) => ({
        ...entry,
        stripeRefundAvailable: !refundedLedgerIds.has(entry.id)
      }))
  };
}

async function insertAdminAction(input: {
  adminUserId: string;
  targetUserId: string;
  actionType: string;
  creditDelta: number;
  stripeRefundId?: string;
  stripeSessionId?: string;
  ledgerEntryId?: string;
  reportJobId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("business_data_admin_actions")
    .insert({
      admin_user_id: input.adminUserId,
      target_user_id: input.targetUserId,
      action_type: input.actionType,
      credit_delta: input.creditDelta,
      stripe_refund_id: input.stripeRefundId ?? null,
      stripe_session_id: input.stripeSessionId ?? null,
      ledger_entry_id: input.ledgerEntryId ?? null,
      report_job_id: input.reportJobId ?? null,
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminActionRow;
}

export async function adjustUserCredits(input: {
  adminUserId: string;
  targetUserId: string;
  amount: number;
  reason: string;
}) {
  const amount = Math.round(input.amount);
  const reason = input.reason.trim();

  if (!reason) {
    throw new Error("A reason is required for credit adjustments.");
  }

  if (amount === 0) {
    throw new Error("Adjustment amount cannot be zero.");
  }

  if (amount > 0) {
    const result = await creditTokens({
      userId: input.targetUserId,
      amount,
      reason: "admin_credit_adjustment",
      metadata: {
        admin_user_id: input.adminUserId,
        note: reason
      }
    });

    await insertAdminAction({
      adminUserId: input.adminUserId,
      targetUserId: input.targetUserId,
      actionType: "credit_adjustment",
      creditDelta: amount,
      metadata: { reason, balance: result.balance ?? null }
    });

    return { balance: result.balance ?? (await getOrCreateWallet(input.targetUserId)).balance };
  }

  const debitAmount = Math.abs(amount);
  const result = await debitTokens({
    userId: input.targetUserId,
    amount: debitAmount,
    reason: "admin_credit_adjustment",
    metadata: {
      admin_user_id: input.adminUserId,
      note: reason
    }
  });

  if (!result.ok) {
    throw new Error("Cannot debit more credits than the user currently has.");
  }

  await insertAdminAction({
    adminUserId: input.adminUserId,
    targetUserId: input.targetUserId,
    actionType: "credit_adjustment",
    creditDelta: -debitAmount,
    metadata: { reason, balance: result.balance }
  });

  return { balance: result.balance };
}

export async function refundReportOperation(input: {
  adminUserId: string;
  targetUserId: string;
  reportJobId: string;
  reason?: string;
}) {
  const supabase = getSupabaseClient();
  const { data: existingRefund } = await supabase
    .from("business_data_admin_actions")
    .select("id")
    .eq("target_user_id", input.targetUserId)
    .eq("report_job_id", input.reportJobId)
    .eq("action_type", "operation_credit_refund")
    .maybeSingle();

  if (existingRefund) {
    throw new Error("Credits for this report were already refunded.");
  }

  const { data: report, error: reportError } = await supabase
    .from("business_data_report_jobs")
    .select("id, user_id, charged_credits, status")
    .eq("id", input.reportJobId)
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (reportError) {
    throw new Error(reportError.message);
  }

  if (!report) {
    throw new Error("Report job not found for this user.");
  }

  const chargedCredits = Number(report.charged_credits);
  if (chargedCredits <= 0) {
    throw new Error("This report has no charged credits to refund.");
  }

  const result = await creditTokens({
    userId: input.targetUserId,
    amount: chargedCredits,
    reason: "admin_operation_credit_refund",
    metadata: {
      admin_user_id: input.adminUserId,
      report_job_id: input.reportJobId,
      note: input.reason ?? null
    }
  });

  await insertAdminAction({
    adminUserId: input.adminUserId,
    targetUserId: input.targetUserId,
    actionType: "operation_credit_refund",
    creditDelta: chargedCredits,
    reportJobId: input.reportJobId,
    metadata: {
      reason: input.reason ?? null,
      balance: result.balance ?? null
    }
  });

  return {
    refundedCredits: chargedCredits,
    balance: result.balance ?? (await getOrCreateWallet(input.targetUserId)).balance
  };
}

type StripeCheckoutSession = {
  id?: string;
  payment_intent?: string | { id?: string };
  amount_total?: number;
  currency?: string;
  metadata?: Record<string, string>;
};

type StripeRefund = {
  id?: string;
  amount?: number;
  status?: string;
  error?: { message?: string };
};

async function fetchStripeCheckoutSession(sessionId: string) {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(15000)
    }
  );

  const json = (await response.json()) as StripeCheckoutSession & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(json.error?.message ?? "Could not load Stripe checkout session.");
  }

  return json;
}

async function createStripeRefund(input: {
  paymentIntentId: string;
  amountCents?: number;
  idempotencyKey: string;
}) {
  const secretKey = getStripeSecretKey();
  const body = new URLSearchParams({
    payment_intent: input.paymentIntentId
  });

  if (input.amountCents && input.amountCents > 0) {
    body.set("amount", String(input.amountCents));
  }

  const response = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": input.idempotencyKey
    },
    body,
    signal: AbortSignal.timeout(15000)
  });

  const json = (await response.json()) as StripeRefund;
  if (!response.ok || !json.id) {
    throw new Error(json.error?.message ?? "Stripe refund failed.");
  }

  return json;
}

export async function refundStripePurchase(input: {
  adminUserId: string;
  targetUserId: string;
  ledgerEntryId: string;
  creditsToDebit?: number;
  reason?: string;
}) {
  const supabase = getSupabaseClient();

  const { data: existingRefund } = await supabase
    .from("business_data_admin_actions")
    .select("id")
    .eq("ledger_entry_id", input.ledgerEntryId)
    .eq("action_type", "stripe_refund")
    .maybeSingle();

  if (existingRefund) {
    throw new Error("This Stripe purchase was already refunded.");
  }

  const { data: ledgerEntry, error: ledgerError } = await supabase
    .from("business_data_token_ledger")
    .select("id, user_id, delta, stripe_session_id, metadata")
    .eq("id", input.ledgerEntryId)
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  if (!ledgerEntry || !ledgerEntry.stripe_session_id) {
    throw new Error("Stripe purchase ledger entry not found.");
  }

  const purchasedCredits = Number(ledgerEntry.delta);
  if (purchasedCredits <= 0) {
    throw new Error("This ledger entry is not a credit purchase.");
  }

  const session = await fetchStripeCheckoutSession(String(ledgerEntry.stripe_session_id));
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntent) {
    throw new Error("Stripe checkout session has no payment intent to refund.");
  }

  const wallet = await getOrCreateWallet(input.targetUserId);
  const requestedDebit =
    input.creditsToDebit === undefined
      ? Math.min(wallet.balance, purchasedCredits)
      : Math.round(input.creditsToDebit);
  const creditsDebited = Math.max(0, Math.min(requestedDebit, wallet.balance, purchasedCredits));

  const refund = await createStripeRefund({
    paymentIntentId: paymentIntent,
    idempotencyKey: `admin-refund:${input.ledgerEntryId}`
  });

  let balance = wallet.balance;
  if (creditsDebited > 0) {
    const debitResult = await debitTokens({
      userId: input.targetUserId,
      amount: creditsDebited,
      reason: "admin_stripe_refund_credit_debit",
      metadata: {
        admin_user_id: input.adminUserId,
        ledger_entry_id: input.ledgerEntryId,
        stripe_refund_id: refund.id,
        note: input.reason ?? null
      }
    });

    if (!debitResult.ok) {
      throw new Error("Stripe refund succeeded but credit debit failed.");
    }

    balance = debitResult.balance;
  }

  await insertAdminAction({
    adminUserId: input.adminUserId,
    targetUserId: input.targetUserId,
    actionType: "stripe_refund",
    creditDelta: -creditsDebited,
    stripeRefundId: refund.id,
    stripeSessionId: String(ledgerEntry.stripe_session_id),
    ledgerEntryId: input.ledgerEntryId,
    metadata: {
      reason: input.reason ?? null,
      purchasedCredits,
      creditsDebited,
      stripeRefundAmount: refund.amount ?? session.amount_total ?? null,
      stripeRefundStatus: refund.status ?? null
    }
  });

  return {
    stripeRefundId: refund.id,
    creditsDebited,
    balance,
    purchasedCredits
  };
}

export async function findAdminUserByEmail(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const wallet = await getOrCreateWallet(user.id);
  return mapAdminUser(user, wallet);
}

export async function getRecentLedgerForAdmin(userId: string, limit = 100) {
  return getRecentLedger(userId, limit);
}
