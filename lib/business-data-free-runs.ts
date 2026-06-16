import { FREE_LIFETIME_RUNS } from "@/lib/business-data-free-config";
import { getClientIdentity } from "@/lib/business-data-rate-limit";
import { supabase } from "@/lib/supabase";
import { createHash } from "node:crypto";

export type FreeRunAccess =
  | { allowed: true; runsUsed: number; runsRemaining: number; requiresSignIn: false }
  | { allowed: true; runsUsed: number; runsRemaining: number; requiresSignIn: false; anonymous: true }
  | { allowed: false; reason: "sign_in_required"; runsUsed: number; runsRemaining: number }
  | { allowed: false; reason: "lifetime_exhausted"; runsUsed: number; runsRemaining: 0 }
  | { allowed: false; reason: "anonymous_exhausted"; runsUsed: number; runsRemaining: 0 };

export function buildAnonymousFingerprint(request: Request) {
  const identity = getClientIdentity(request);
  const sessionKey = request.headers.get("x-trb-session") ?? "";
  const raw = `${identity.ip}|${sessionKey}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

async function getAccountRunsUsed(userId: string) {
  const { data, error } = await supabase
    .from("business_data_free_runs")
    .select("runs_used")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[business-data-free-runs]", error.message);
    return 0;
  }

  return Number(data?.runs_used ?? 0);
}

async function getAnonymousRunsUsed(fingerprint: string) {
  const { data, error } = await supabase
    .from("business_data_anonymous_free_runs")
    .select("runs_used")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (error) {
    console.error("[business-data-anonymous-free-runs]", error.message);
    return 0;
  }

  return Number(data?.runs_used ?? 0);
}

async function getEffectiveAccountRunsUsed(request: Request, userId: string) {
  const accountRuns = await getAccountRunsUsed(userId);
  if (accountRuns > 0) {
    return accountRuns;
  }

  const anonymousUsed = await getAnonymousRunsUsed(buildAnonymousFingerprint(request));
  return anonymousUsed >= 1 ? 1 : 0;
}

export async function evaluateFreeRunAccess(request: Request, userId?: string | null) {
  if (userId) {
    const runsUsed = await getEffectiveAccountRunsUsed(request, userId);
    const runsRemaining = Math.max(FREE_LIFETIME_RUNS - runsUsed, 0);

    if (runsRemaining <= 0) {
      return {
        allowed: false,
        reason: "lifetime_exhausted",
        runsUsed,
        runsRemaining: 0
      } satisfies FreeRunAccess;
    }

    return {
      allowed: true,
      runsUsed,
      runsRemaining,
      requiresSignIn: false
    } satisfies FreeRunAccess;
  }

  const fingerprint = buildAnonymousFingerprint(request);
  const anonymousUsed = await getAnonymousRunsUsed(fingerprint);

  if (anonymousUsed >= 1) {
    return {
      allowed: false,
      reason: "sign_in_required",
      runsUsed: anonymousUsed,
      runsRemaining: Math.max(FREE_LIFETIME_RUNS - anonymousUsed, 0)
    } satisfies FreeRunAccess;
  }

  return {
    allowed: true,
    runsUsed: 0,
    runsRemaining: FREE_LIFETIME_RUNS,
    requiresSignIn: false,
    anonymous: true
  } satisfies FreeRunAccess;
}

export async function recordFreeRunUsage(request: Request, userId?: string | null) {
  const now = new Date().toISOString();

  if (userId) {
    const current = await getEffectiveAccountRunsUsed(request, userId);
    const next = current + 1;

    const { error } = await supabase.from("business_data_free_runs").upsert(
      {
        user_id: userId,
        runs_used: next,
        updated_at: now
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("[business-data-free-runs]", error.message);
    }

    return {
      runsUsed: next,
      runsRemaining: Math.max(FREE_LIFETIME_RUNS - next, 0)
    };
  }

  const fingerprint = buildAnonymousFingerprint(request);
  const current = await getAnonymousRunsUsed(fingerprint);
  const next = current + 1;

  const { error } = await supabase.from("business_data_anonymous_free_runs").upsert(
    {
      fingerprint,
      runs_used: next,
      updated_at: now
    },
    { onConflict: "fingerprint" }
  );

  if (error) {
    console.error("[business-data-anonymous-free-runs]", error.message);
  }

  return {
    runsUsed: next,
    runsRemaining: Math.max(FREE_LIFETIME_RUNS - next, 0)
  };
}

export async function getFreeRunStatus(request: Request, userId?: string | null) {
  if (userId) {
    const runsUsed = await getEffectiveAccountRunsUsed(request, userId);
    return {
      runsUsed,
      runsRemaining: Math.max(FREE_LIFETIME_RUNS - runsUsed, 0),
      runsLimit: FREE_LIFETIME_RUNS,
      requiresSignIn: false
    };
  }

  const fingerprint = buildAnonymousFingerprint(request);
  const anonymousUsed = await getAnonymousRunsUsed(fingerprint);

  return {
    runsUsed: anonymousUsed,
    runsRemaining: anonymousUsed >= 1 ? Math.max(FREE_LIFETIME_RUNS - 1, 0) : FREE_LIFETIME_RUNS,
    runsLimit: FREE_LIFETIME_RUNS,
    requiresSignIn: anonymousUsed >= 1
  };
}
