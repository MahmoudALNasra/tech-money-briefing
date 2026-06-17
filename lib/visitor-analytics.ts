import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";

const trackingSecret =
  process.env.TRACKING_HASH_SECRET ??
  process.env.CRON_SECRET ??
  "development-tracking-secret";

export function hashTrackingValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return createHmac("sha256", trackingSecret).update(value).digest("hex");
}

export function getClientIp(request: NextRequest | Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for")
  );
}

export function getExcludedAnalyticsIps() {
  return (process.env.ANALYTICS_EXCLUDED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export function isExcludedAnalyticsIp(ip: string | null | undefined) {
  if (!ip) {
    return false;
  }

  const normalized = ip.trim();
  return getExcludedAnalyticsIps().includes(normalized);
}

export function getExcludedAnalyticsIpHashes() {
  return getExcludedAnalyticsIps()
    .map((ip) => hashTrackingValue(ip))
    .filter((hash): hash is string => Boolean(hash));
}

export function filterExcludedAnalyticsRows<
  T extends { ip_hash?: string | null }
>(rows: T[]) {
  const excludedHashes = new Set(getExcludedAnalyticsIpHashes());

  if (excludedHashes.size === 0) {
    return rows;
  }

  return rows.filter((row) => !row.ip_hash || !excludedHashes.has(row.ip_hash));
}

export function parseArticlePath(pathname: string) {
  const match = pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);

  if (!match) {
    return { category: null, articleSlug: null };
  }

  const category = match[1];
  const reserved = new Set([
    "tools",
    "compare",
    "contact",
    "search",
    "about",
    "privacy",
    "terms",
    "analytics",
    "advertise",
    "monetization-audit",
    "monetization-checklist"
  ]);

  if (reserved.has(category) || category.includes(".")) {
    return { category: null, articleSlug: null };
  }

  return { category, articleSlug: match[2] };
}

export function isAnalyticsDashboardTokenAuthorized(request: Request) {
  const token = process.env.ANALYTICS_DASHBOARD_TOKEN;

  if (!token) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const queryToken = new URL(request.url).searchParams.get("token");

  return authHeader === `Bearer ${token}` || queryToken === token;
}

export function isAnalyticsDashboardAuthorized(request: Request) {
  return isAnalyticsDashboardTokenAuthorized(request);
}

export async function isAnalyticsDashboardAccessGranted(request: Request) {
  if (isAnalyticsDashboardTokenAuthorized(request)) {
    return true;
  }

  const admin = await getAdminFromRequest(request);
  return admin !== null;
}
