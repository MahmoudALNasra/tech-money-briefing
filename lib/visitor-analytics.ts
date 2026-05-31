import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

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

export function isAnalyticsDashboardAuthorized(request: Request) {
  const token = process.env.ANALYTICS_DASHBOARD_TOKEN;

  if (!token) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const queryToken = new URL(request.url).searchParams.get("token");

  return authHeader === `Bearer ${token}` || queryToken === token;
}
