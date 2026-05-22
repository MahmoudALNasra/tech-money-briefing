import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

import { supabase } from "@/lib/supabase";

const trackingSecret =
  process.env.TRACKING_HASH_SECRET ??
  process.env.CRON_SECRET ??
  "development-tracking-secret";

function hashValue(value: string | null) {
  if (!value) {
    return null;
  }

  return createHmac("sha256", trackingSecret).update(value).digest("hex");
}

function getClientIp(request: NextRequest) {
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

export function normalizeCampaignSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function normalizeInternalDestination(destination: string | null) {
  if (!destination || !destination.startsWith("/")) {
    return "/";
  }

  if (destination.startsWith("//")) {
    return "/";
  }

  return destination.slice(0, 240);
}

export async function trackCustomLinkVisit({
  request,
  campaign,
  destinationPath
}: {
  request: NextRequest;
  campaign: string;
  destinationPath: string;
}) {
  const userAgent = request.headers.get("user-agent");
  const ip = getClientIp(request);

  const { error } = await supabase.from("custom_link_visits").insert({
    campaign,
    destination_path: destinationPath,
    ip_hash: hashValue(ip),
    user_agent: userAgent,
    user_agent_hash: hashValue(userAgent),
    referrer: request.headers.get("referer"),
    accept_language: request.headers.get("accept-language"),
    country: request.headers.get("x-vercel-ip-country"),
    region: request.headers.get("x-vercel-ip-country-region"),
    city: request.headers.get("x-vercel-ip-city"),
    host: request.headers.get("host")
  });

  if (error) {
    console.error("Failed to track custom link visit", error);
  }
}
