"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";
import { formatCreditBalance } from "@/lib/format-token-balance";

type AdminUserSummary = {
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

type LedgerEntry = {
  id: string;
  delta: number;
  balance_after: number;
  reason: string;
  stripe_session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  stripeRefundAvailable?: boolean;
};

type ReportJobSummary = {
  id: string;
  status: string;
  requestedCount: number;
  processedCount: number;
  chargedCredits: number;
  location: string;
  category: string;
  createdAt: string;
  filename: string;
  creditRefundAvailable: boolean;
};

type AdminActionRow = {
  id: string;
  action_type: string;
  credit_delta: number;
  stripe_refund_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

type UserDetail = {
  user: AdminUserSummary;
  wallet: {
    balance: number;
    lifetimeCredited: number;
    lifetimeDebited: number;
  };
  ledger: LedgerEntry[];
  reportJobs: ReportJobSummary[];
  adminActions: AdminActionRow[];
  stripePurchases: LedgerEntry[];
};

export function AdminDashboard() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [message, setMessage] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const loadUsers = useCallback(async (search = query) => {
    setIsLoadingUsers(true);
    setMessage("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("q", search.trim());
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as { users?: AdminUserSummary[]; error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not load users.");
      }

      setUsers(json.users ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [query]);

  const loadDetail = useCallback(async (userId: string) => {
    setIsLoadingDetail(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as UserDetail & { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not load user detail.");
      }

      setDetail(json);
      setSelectedUserId(userId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers("");
  }, [loadUsers]);

  const adjustCredits = async () => {
    if (!selectedUserId) {
      return;
    }

    const amount = Number(creditAmount);
    if (!Number.isFinite(amount) || amount === 0 || !creditReason.trim()) {
      setMessage("Enter a non-zero credit amount and a reason.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedUserId)}/credits`, {
        method: "POST",
        headers: await getBusinessDataAuthHeaders(),
        body: JSON.stringify({ amount, reason: creditReason.trim() })
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Credit adjustment failed.");
      }

      setCreditAmount("");
      setCreditReason("");
      setMessage("Credit balance updated.");
      await Promise.all([loadUsers(), loadDetail(selectedUserId)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const refundReport = async (reportJobId: string, chargedCredits: number) => {
    if (!selectedUserId) {
      return;
    }

    const confirmed = window.confirm(
      `Refund ${formatCreditBalance(chargedCredits)} credits for this report?`
    );
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(selectedUserId)}/refund-operation`,
        {
          method: "POST",
          headers: await getBusinessDataAuthHeaders(),
          body: JSON.stringify({
            reportJobId,
            reason: refundReason.trim() || undefined
          })
        }
      );
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Report credit refund failed.");
      }

      setMessage("Report credits refunded.");
      await Promise.all([loadUsers(), loadDetail(selectedUserId)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const refundStripe = async (ledgerEntry: LedgerEntry) => {
    if (!selectedUserId) {
      return;
    }

    const purchasedCredits = ledgerEntry.delta;
    const confirmed = window.confirm(
      `Issue a Stripe refund for this purchase and debit up to ${formatCreditBalance(
        purchasedCredits
      )} unused credits from the wallet?`
    );
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(selectedUserId)}/stripe-refund`,
        {
          method: "POST",
          headers: await getBusinessDataAuthHeaders(),
          body: JSON.stringify({
            ledgerEntryId: ledgerEntry.id,
            reason: refundReason.trim() || undefined
          })
        }
      );
      const json = (await response.json()) as {
        stripeRefundId?: string;
        creditsDebited?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Stripe refund failed.");
      }

      setMessage(
        `Stripe refund ${json.stripeRefundId ?? "created"}. Debited ${formatCreditBalance(
          json.creditsDebited ?? 0
        )} credits.`
      );
      await Promise.all([loadUsers(), loadDetail(selectedUserId)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-ink bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
          Admin
        </span>
        <Link
          href="/analytics"
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-600 transition hover:border-stone-300"
        >
          Analytics
        </Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
          Confidential
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
          Account operations
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Search accounts, review wallet activity, restore report credits, and process eligible
          payment refunds.
        </p>

        <div className="mt-5 flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by email"
            className="min-h-11 flex-1 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
          />
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={isLoadingUsers}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
          >
            Search
          </button>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {message}
          </p>
        ) : null}

        <div className="mt-5 space-y-2">
          {isLoadingUsers ? (
            <p className="text-sm font-semibold text-stone-600">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-600">
              No users found.
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => void loadDetail(user.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selectedUserId === user.id
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white"
                }`}
              >
                <p className="text-sm font-black text-ink">{user.email}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {user.providerLabel} · {formatCreditBalance(user.balance)} credits
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        {!detail || isLoadingDetail ? (
          <p className="text-sm font-semibold text-stone-600">
            {isLoadingDetail ? "Loading user detail..." : "Select a user to manage credits."}
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                Selected user
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink">{detail.user.email}</h2>
              <p className="mt-2 text-sm text-stone-600">
                {detail.user.providerLabel} · Last sign-in{" "}
                {detail.user.lastSignInAt
                  ? new Date(detail.user.lastSignInAt).toLocaleString()
                  : "Unknown"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-bold text-stone-500">Balance</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {formatCreditBalance(detail.wallet.balance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-bold text-stone-500">Lifetime credited</p>
                  <p className="mt-1 text-2xl font-black text-ink">
                    {formatCreditBalance(detail.wallet.lifetimeCredited)}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-bold text-stone-500">Lifetime used</p>
                  <p className="mt-1 text-2xl font-black text-ink">
                    {formatCreditBalance(detail.wallet.lifetimeDebited)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-sm font-black text-ink">Manual credit adjustment</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(event) => setCreditAmount(event.target.value)}
                  placeholder="Amount (+/- credits)"
                  className="min-h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
                />
                <input
                  value={creditReason}
                  onChange={(event) => setCreditReason(event.target.value)}
                  placeholder="Reason"
                  className="min-h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
                />
              </div>
              <button
                type="button"
                onClick={() => void adjustCredits()}
                disabled={isSaving}
                className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Apply adjustment"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-black text-ink">
                Refund note
                <input
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                  placeholder="Optional note for report or Stripe refunds"
                  className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-black text-ink">Report operations</p>
              <div className="mt-3 space-y-2">
                {detail.reportJobs.length === 0 ? (
                  <p className="text-sm text-stone-600">No report jobs yet.</p>
                ) : (
                  detail.reportJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm"
                    >
                      <p className="font-bold text-ink">
                        {job.category} near {job.location}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(job.createdAt).toLocaleString()} · {job.status} · charged{" "}
                        {formatCreditBalance(job.chargedCredits)} credits
                      </p>
                      {job.creditRefundAvailable ? (
                        <button
                          type="button"
                          onClick={() => void refundReport(job.id, job.chargedCredits)}
                          disabled={isSaving}
                          className="mt-3 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          Refund report credits
                        </button>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-stone-500">
                          No refundable credits for this report.
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-black text-ink">Stripe purchases</p>
              <div className="mt-3 space-y-2">
                {detail.stripePurchases.length === 0 ? (
                  <p className="text-sm text-stone-600">No Stripe credit purchases yet.</p>
                ) : (
                  detail.stripePurchases.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm"
                    >
                      <p className="font-bold text-ink">
                        +{formatCreditBalance(entry.delta)} credits · {entry.reason}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(entry.created_at).toLocaleString()} · session{" "}
                        {entry.stripe_session_id}
                      </p>
                      {entry.stripeRefundAvailable ? (
                        <button
                          type="button"
                          onClick={() => void refundStripe(entry)}
                          disabled={isSaving}
                          className="mt-3 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-black text-rose-800 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          Stripe refund
                        </button>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-stone-500">Already refunded.</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-black text-ink">Ledger</p>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {detail.ledger.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-stone-200 px-4 py-3 text-sm"
                  >
                    <p className="font-bold text-ink">
                      {entry.delta > 0 ? "+" : ""}
                      {entry.delta} credits · {entry.reason}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(entry.created_at).toLocaleString()} · balance after{" "}
                      {formatCreditBalance(entry.balance_after)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-black text-ink">Admin actions</p>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {detail.adminActions.length === 0 ? (
                  <p className="text-sm text-stone-600">No admin actions yet.</p>
                ) : (
                  detail.adminActions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-xl border border-stone-200 px-4 py-3 text-sm"
                    >
                      <p className="font-bold text-ink">
                        {action.action_type} · {action.credit_delta > 0 ? "+" : ""}
                        {action.credit_delta} credits
                      </p>
                      <p className="text-xs text-stone-500">
                        {new Date(action.created_at).toLocaleString()}
                        {action.stripe_refund_id ? ` · refund ${action.stripe_refund_id}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
