"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  buildAnalyticsApiUrl,
  getAnalyticsRequestInit,
  withClientTimeout
} from "@/lib/analytics-dashboard-client";
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
  unique_visitors_24h: number;
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
  top_search_categories?: Array<{ label: string; count: number }>;
  top_search_locations?: Array<{ label: string; count: number }>;
  top_business_searches?: Array<{ label: string; count: number }>;
  recent_business_searches?: BusinessDataSearch[];
  api_credit_accounts?: ApiCreditAccount[];
};

type BusinessDataSearch = {
  created_at: string;
  category: string;
  location: string;
  center_label: string;
  visitor_country: string;
  visitor_region: string;
  visitor_city: string;
  radius_meters: number;
  result_count: number;
  total_available_estimate: number;
  paid_access: boolean;
  provider: string;
  result_names: string[];
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

function RecentBusinessSearches({
  searches
}: {
  searches: BusinessDataSearch[];
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-5 py-4">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
          Recent business searches
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Category, searched area, searcher location, and sample businesses from today.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.16em] text-stone-500">
            <tr>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Search</th>
              <th className="px-5 py-3">Searcher location</th>
              <th className="px-5 py-3">Area</th>
              <th className="px-5 py-3">Results</th>
              <th className="px-5 py-3">Sample businesses</th>
            </tr>
          </thead>
          <tbody>
            {searches.length > 0 ? (
              searches.map((search) => (
                <tr
                  key={`${search.created_at}-${search.category}-${search.center_label}`}
                  className="border-t border-stone-100"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-stone-500">
                    {formatTime(search.created_at)}
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink">
                    {search.category || "unknown"}
                    <span className="mt-1 block text-xs font-medium text-stone-500">
                      {search.paid_access ? "Paid access" : "Free preview"} ·{" "}
                      {search.provider || "provider unknown"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-stone-600">
                    {search.visitor_city || search.visitor_region || search.visitor_country
                      ? [search.visitor_city, search.visitor_region, search.visitor_country]
                          .filter(Boolean)
                          .join(", ")
                      : "unknown"}
                  </td>
                  <td className="max-w-xs px-5 py-3 text-stone-600">
                    <span className="line-clamp-2">
                      {search.center_label || search.location || "unknown"}
                    </span>
                    <span className="mt-1 block text-xs text-stone-400">
                      Radius {search.radius_meters.toLocaleString()}m
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-stone-600">
                    {search.result_count.toLocaleString()} shown
                    <span className="mt-1 block text-xs text-stone-400">
                      {search.total_available_estimate.toLocaleString()} est.
                    </span>
                  </td>
                  <td className="max-w-sm px-5 py-3 text-stone-600">
                    {search.result_names.length > 0
                      ? search.result_names.join(", ")
                      : "No sample names"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-6 text-sm text-stone-500" colSpan={6}>
                  No business searches logged today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
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

function AnalyticsLanding({
  tokenInput,
  isCheckingAdmin,
  loginError,
  onTokenInputChange,
  onSubmit
}: {
  tokenInput: string;
  isCheckingAdmin: boolean;
  loginError: string;
  onTokenInputChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center px-5 py-16">
      <div
        className="w-full rounded-[2rem] border border-stone-200 bg-white p-8 shadow-xl"
        data-surface="light"
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">
          Private dashboard
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
          Real-time visitor analytics
        </h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          Enter your dashboard token, or sign in as an admin with MFA at{" "}
          <Link href="/admin" className="font-semibold text-ink underline">
            /admin
          </Link>{" "}
          and return here.
        </p>
        <p className="mt-3 text-xs leading-6 text-stone-500">
          Bookmark access with{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-700">
            /analytics?token=YOUR_TOKEN
          </code>
        </p>
        {isCheckingAdmin ? (
          <p className="mt-4 text-sm font-semibold text-stone-500">
            Checking admin access in the background...
          </p>
        ) : null}
        {loginError ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {loginError}
          </p>
        ) : null}
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <input
            value={tokenInput}
            onChange={(event) => onTokenInputChange(event.target.value)}
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

export function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token")?.trim() ?? "";

  const [tokenInput, setTokenInput] = useState(queryToken);
  const [token, setToken] = useState(queryToken);
  const [adminAccess, setAdminAccess] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  const canLoadDashboard = Boolean(token) || adminAccess;

  useEffect(() => {
    const nextToken = searchParams.get("token")?.trim() ?? "";
    setTokenInput(nextToken);
    setToken(nextToken);
    setLoginError("");
  }, [searchParams]);

  useEffect(() => {
    if (queryToken) {
      return;
    }

    let cancelled = false;

    async function probeAdminAccess() {
      setIsCheckingAdmin(true);

      try {
        const requestInit = await withClientTimeout(getAnalyticsRequestInit({}), 4000);

        if (!requestInit || cancelled) {
          return;
        }

        const response = await withClientTimeout(
          fetch("/api/analytics/summary", requestInit),
          4000
        );

        if (!cancelled && response?.ok) {
          setAdminAccess(true);
        }
      } catch {
        // Ignore background admin probe failures and keep the login form visible.
      } finally {
        if (!cancelled) {
          setIsCheckingAdmin(false);
        }
      }
    }

    void probeAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [queryToken]);

  useEffect(() => {
    if (!canLoadDashboard) {
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      setIsLoading(true);

      try {
        const requestInit = await getAnalyticsRequestInit({
          dashboardToken: token || undefined,
          adminAccess
        });
        const [summaryResponse, usageResponse] = await Promise.all([
          fetch(buildAnalyticsApiUrl("/api/analytics/summary", token || undefined), requestInit),
          fetch(buildAnalyticsApiUrl("/api/analytics/usage", token || undefined), requestInit)
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
          setLoginError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load analytics.";

          if (token) {
            setToken("");
            setLoginError(message);
          } else {
            setError(message);
          }
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
  }, [adminAccess, canLoadDashboard, token]);

  const handleTokenSubmit = () => {
    const nextToken = tokenInput.trim();

    if (!nextToken) {
      setLoginError("Enter your analytics dashboard token.");
      return;
    }

    setLoginError("");
    setError("");
    setToken(nextToken);
    router.replace(`/analytics?token=${encodeURIComponent(nextToken)}`, { scroll: false });
  };

  const updatedLabel = summary?.generated_at
    ? `Updated ${formatTime(summary.generated_at)}`
    : "Waiting for data";

  if (!canLoadDashboard) {
    return (
      <AnalyticsLanding
        tokenInput={tokenInput}
        isCheckingAdmin={isCheckingAdmin}
        loginError={loginError}
        onTokenInputChange={setTokenInput}
        onSubmit={handleTokenSubmit}
      />
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-stone-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-600 transition hover:border-stone-300"
          >
            Admin
          </Link>
          <span className="rounded-full border border-ink bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
            Analytics
          </span>
        </div>
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
            label="Unique users (24h)"
            value={summary?.unique_visitors_24h ?? 0}
            hint="Distinct visitor IDs with any tracked activity in the last 24 hours"
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
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <RankList
              title="Top searched categories"
              items={usage?.top_search_categories ?? []}
            />
            <RankList
              title="Top searched locations"
              items={usage?.top_search_locations ?? []}
            />
            <RankList
              title="Top category + location"
              items={usage?.top_business_searches ?? []}
            />
          </div>
          <div className="mt-4">
            <RecentBusinessSearches
              searches={usage?.recent_business_searches ?? []}
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
          <RankList title="Top pages (30m)" items={summary?.top_pages ?? []} />
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
