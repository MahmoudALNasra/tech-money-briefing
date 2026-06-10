"use client";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/session-duration";

type SessionDurationStats = {
  session_count: number;
  avg_seconds: number;
  median_seconds: number;
};

type SummaryResponse = {
  generated_at: string;
  active_visitors_5m: number;
  page_views_30m: number;
  page_views_24h: number;
  session_duration_30m: SessionDurationStats;
  session_duration_24h: SessionDurationStats;
  top_pages: Array<{ label: string; count: number }>;
  top_referrers: Array<{ label: string; count: number }>;
  top_events: Array<{ label: string; count: number }>;
  top_countries: Array<{ label: string; count: number }>;
  recent_events: Array<{
    id: string;
    event_name: string;
    page_path: string | null;
    page_title: string | null;
    referrer: string | null;
    country: string | null;
    device_type: string | null;
    metadata?: Record<string, unknown>;
    created_at: string;
  }>;
};

type UsageResponse = {
  generated_at: string;
  window_label?: string;
  window_start?: string;
  searches: number;
  free_previews?: number;
  free_preview_estimated_api_cost_usd?: number;
  exports: number;
  drive_uploads: number;
  tokens_issued: number;
  tokens_consumed: number;
  tokens_remaining_total: number;
  estimated_api_cost_usd: number;
  estimated_revenue_usd: number;
  estimated_margin_usd: number;
  estimated_margin_pct: number;
  top_events: Array<{ label: string; count: number }>;
  api_credit_accounts?: ApiCreditAccount[];
};

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

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not configured";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatDaysUntil(value: number | null) {
  if (value === null) {
    return "Add expiry env";
  }

  if (value < 0) {
    return `${Math.abs(value)} days expired`;
  }

  if (value === 0) {
    return "Expires today";
  }

  return `${value} days left`;
}

function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-ink">{value}</p>
      {hint ? (
        <p className="mt-2 text-xs leading-6 text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}

function RankList({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${title}-${item.label}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"
            >
              <span className="truncate text-sm font-semibold text-ink">
                {item.label}
              </span>
              <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-black text-white">
                {item.count}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function ApiCreditCard({ account }: { account: ApiCreditAccount }) {
  const statusClass =
    account.status === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : account.status === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : account.status === "missing"
          ? "border-stone-200 bg-stone-50 text-stone-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-800";
  const remainingLabel =
    account.estimatedRemaining === null
      ? "Set credit total"
      : account.estimatedRemaining.toLocaleString();
  const limitLabel =
    account.creditLimit === null ? "unknown limit" : `${account.creditLimit.toLocaleString()} total`;

  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">
            {account.provider}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-ink">
            {remainingLabel}
          </p>
          <p className="mt-1 text-xs font-semibold text-stone-500">estimated credits remaining</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass}`}>
          {account.keyConfigured ? account.status : "missing key"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-xs font-bold text-stone-500">Used</p>
          <p className="mt-1 font-black text-ink">{account.creditsUsed.toLocaleString()}</p>
          <p className="text-xs text-stone-500">{limitLabel}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-xs font-bold text-stone-500">Last 24h</p>
          <p className="mt-1 font-black text-ink">
            {account.creditsUsedLast24h.toLocaleString()}
          </p>
          <p className="text-xs text-stone-500">tracked calls</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-xs font-bold text-stone-500">Renewal</p>
          <p className="mt-1 font-black text-ink">{formatDaysUntil(account.daysUntilExpiry)}</p>
          <p className="text-xs text-stone-500">{formatDate(account.expiresAt)}</p>
        </div>
      </div>
      {account.notes.length > 0 ? (
        <p className="mt-4 text-xs leading-6 text-stone-500">{account.notes.join(" ")}</p>
      ) : null}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get("token");

    if (!queryToken) {
      return;
    }

    window.queueMicrotask(() => {
      setToken(queryToken);
      setTokenInput(queryToken);
    });
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      setIsLoading(true);

      try {
        const [summaryResponse, usageResponse] = await Promise.all([
          fetch(`/api/analytics/summary?token=${encodeURIComponent(token)}`),
          fetch(`/api/analytics/usage?token=${encodeURIComponent(token)}`)
        ]);
        const json = (await summaryResponse.json()) as SummaryResponse & { error?: string };
        const usageJson = (await usageResponse.json()) as UsageResponse & { error?: string };

        if (!summaryResponse.ok) {
          throw new Error(json.error ?? "Failed to load analytics.");
        }

        if (!cancelled) {
          setSummary(json);
          setUsage(usageResponse.ok ? usageJson : null);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load analytics."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();
    const interval = window.setInterval(() => {
      void loadSummary();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [token]);

  const updatedLabel = summary?.generated_at
    ? `Updated ${formatTime(summary.generated_at)}`
    : "Waiting for data";

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-16">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white p-8 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">
            Private dashboard
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
            Real-time visitor analytics
          </h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Enter your dashboard token to view live visitors, page views, referrers,
            and recent events.
          </p>
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setToken(tokenInput.trim());
            }}
          >
            <input
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Analytics dashboard token"
              className="min-h-11 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none ring-stone-200 focus:ring-4"
            />
            <button
              type="submit"
              className="min-h-11 w-full rounded-full bg-ink px-5 text-sm font-bold text-white transition hover:bg-stone-700"
            >
              Open dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">
              Tech Revenue Brief
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">
              Real-time analytics
            </h1>
            <p className="mt-2 text-sm text-stone-600">{updatedLabel}</p>
          </div>
          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600">
            {isLoading ? "Refreshing..." : "Auto-refresh every 12s"}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Active visitors"
            value={summary?.active_visitors_5m ?? 0}
            hint="Unique sessions active in the last 5 minutes"
          />
          <MetricCard
            label="Page views (30m)"
            value={summary?.page_views_30m ?? 0}
            hint="All page loads in the last 30 minutes"
          />
          <MetricCard
            label="Page views (24h)"
            value={summary?.page_views_24h ?? 0}
            hint="All page loads in the last 24 hours"
          />
          <MetricCard
            label="Avg session (30m)"
            value={formatDuration(summary?.session_duration_30m?.avg_seconds ?? 0)}
            hint={`Median ${formatDuration(summary?.session_duration_30m?.median_seconds ?? 0)} across ${summary?.session_duration_30m?.session_count ?? 0} sessions`}
          />
          <MetricCard
            label="Avg session (24h)"
            value={formatDuration(summary?.session_duration_24h?.avg_seconds ?? 0)}
            hint={`Median ${formatDuration(summary?.session_duration_24h?.median_seconds ?? 0)} across ${summary?.session_duration_24h?.session_count ?? 0} sessions`}
          />
          <MetricCard
            label="Session signals"
            value="ping + end"
            hint="session_ping keeps visitors active; session_end records time on site when they leave"
          />
        </div>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-ink">Business data consumption</h2>
            <p className="mt-1 text-sm text-stone-600">
              Today&apos;s free previews, paid token usage, API cost estimates, and revenue margin.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Free previews today"
              value={usage?.free_previews ?? usage?.searches ?? 0}
              hint={`${formatUsd(usage?.free_preview_estimated_api_cost_usd ?? 0)} estimated API cost`}
            />
            <MetricCard
              label="Paid exports"
              value={usage?.exports ?? 0}
              hint="Full enriched CSV exports"
            />
            <MetricCard
              label="Tokens consumed"
              value={usage?.tokens_consumed ?? 0}
              hint="Paid credits consumed today; free previews consume 0 tokens"
            />
            <MetricCard
              label="Estimated margin"
              value={usage ? `${usage.estimated_margin_pct}%` : "0%"}
              hint={
                usage
                  ? `${formatUsd(usage.estimated_revenue_usd)} revenue vs ${formatUsd(usage.estimated_api_cost_usd)} total API cost today`
                  : "Waiting for usage data"
              }
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <RankList title="Business data events" items={usage?.top_events ?? []} />
            <MetricCard
              label="Drive uploads"
              value={usage?.drive_uploads ?? 0}
              hint={`Tokens issued in window: ${usage?.tokens_issued ?? 0}`}
            />
            <MetricCard
              label="Wallet tokens remaining"
              value={usage?.tokens_remaining_total ?? 0}
              hint="Current balance across all business data wallets"
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-ink">API credit monitor</h2>
            <p className="mt-1 text-sm text-stone-600">
              Server-side key status, tracked API usage, estimated remaining credits, and renewal
              deadlines.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(usage?.api_credit_accounts ?? []).length > 0 ? (
              usage?.api_credit_accounts?.map((account) => (
                <ApiCreditCard key={account.provider} account={account} />
              ))
            ) : (
              <MetricCard
                label="API credit monitor"
                value="Waiting"
                hint="Usage data will appear after the private analytics endpoint refreshes."
              />
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <RankList title="Live pages" items={summary?.top_pages ?? []} />
          <RankList title="Referrers" items={summary?.top_referrers ?? []} />
          <RankList title="Top events" items={summary?.top_events ?? []} />
          <RankList title="Countries" items={summary?.top_countries ?? []} />
        </div>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
              Recent events
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.16em] text-stone-500">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Referrer</th>
                  <th className="px-5 py-3">Country</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.recent_events ?? []).map((event) => (
                  <tr key={event.id} className="border-t border-stone-100">
                    <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                      {formatTime(event.created_at)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink">
                      {event.event_name}
                      {event.event_name === "session_end" &&
                      typeof event.metadata?.duration_seconds === "number"
                        ? ` (${formatDuration(event.metadata.duration_seconds)})`
                        : null}
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate">
                      {event.page_path ?? "—"}
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate text-stone-600">
                      {event.referrer ?? "direct"}
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {event.country ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
