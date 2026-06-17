"use client";

import { isLikelyBotUserAgent } from "@/lib/bot-detection";

const ANALYTICS_OPT_OUT_KEY = "tech-revenue-brief-disable-analytics";
export { ANALYTICS_OPT_OUT_KEY };
const VISITOR_ID_KEY = "tech-revenue-brief-visitor-id";
const SESSION_ID_KEY = "tech-revenue-brief-session-id";
const SESSION_STARTED_AT_KEY = "tech-revenue-brief-session-started-at";

export type AnalyticsClientEvent = {
  event: string;
  page_path?: string;
  page_title?: string;
  article_id?: string;
  article_slug?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

function analyticsDisabled() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
}

let eligibilityPromise: Promise<boolean> | null = null;

export function ensureAnalyticsEligibility() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (analyticsDisabled()) {
    return Promise.resolve(true);
  }

  if (!eligibilityPromise) {
    eligibilityPromise = fetch("/api/analytics/eligibility", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }

        const json = (await response.json()) as { excluded?: boolean };
        if (json.excluded) {
          window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
          return true;
        }

        return false;
      })
      .catch(() => false);
  }

  return eligibilityPromise;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsVisitorId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(VISITOR_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId = createId();
  window.localStorage.setItem(VISITOR_ID_KEY, nextId);
  return nextId;
}

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId = createId();
  window.sessionStorage.setItem(SESSION_ID_KEY, nextId);
  window.sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(Date.now()));
  return nextId;
}

export function getAnalyticsSessionStartedAt() {
  if (typeof window === "undefined") {
    return Date.now();
  }

  const existing = window.sessionStorage.getItem(SESSION_STARTED_AT_KEY);

  if (existing) {
    return Number.parseInt(existing, 10) || Date.now();
  }

  const startedAt = Date.now();
  window.sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(startedAt));
  return startedAt;
}

export function getAnalyticsSessionDurationSeconds() {
  return Math.max(
    1,
    Math.round((Date.now() - getAnalyticsSessionStartedAt()) / 1000)
  );
}

function getUtmParams() {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_term: params.get("utm_term"),
    utm_content: params.get("utm_content")
  };
}

function getDeviceType() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

export function trackAnalyticsEvent(event: AnalyticsClientEvent) {
  if (
    analyticsDisabled() ||
    typeof window === "undefined" ||
    isLikelyBotUserAgent(navigator.userAgent)
  ) {
    return;
  }

  void ensureAnalyticsEligibility().then((excluded) => {
    if (excluded || analyticsDisabled()) {
      return;
    }

    sendAnalyticsEvent(event);
  });
}

function sendAnalyticsEvent(event: AnalyticsClientEvent) {
  const {
    event: eventName,
    metadata = {},
    page_path,
    page_title,
    article_id,
    article_slug,
    category,
    ...rest
  } = event;

  const payload = {
    event: eventName,
    visitor_id: getAnalyticsVisitorId(),
    session_id: getAnalyticsSessionId(),
    page_path: page_path ?? window.location.pathname,
    page_title: page_title ?? document.title,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    article_id,
    article_slug,
    category,
    metadata: {
      ...metadata,
      ...Object.fromEntries(
        Object.entries(rest).filter(
          ([key, value]) =>
            ![
              "event",
              "visitor_id",
              "session_id",
              "page_path",
              "page_title",
              "referrer",
              "device_type",
              "viewport_width",
              "viewport_height",
              "timezone",
              "language"
            ].includes(key) &&
            (typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean")
        )
      )
    },
    ...getUtmParams()
  };

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/track", blob);
    return;
  }

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  });
}
