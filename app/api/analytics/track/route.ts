import { NextResponse } from "next/server";

import { isLikelyBotUserAgent } from "@/lib/bot-detection";
import {
  getClientIp,
  hashTrackingValue,
  isExcludedAnalyticsIp,
  parseArticlePath
} from "@/lib/visitor-analytics";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "article_read_50_percent",
  "ad_click",
  "newsletter_signup",
  "promotion_click",
  "sponsor_click",
  "monetization_audit_submit",
  "tool_assistant_open",
  "tool_assistant_message",
  "tool_assistant_prompt_click",
  "tool_assistant_suggested_tool_click",
  "contact_form_submit",
  "advanced_tool_download",
  "advanced_tool_next_action_click",
  "business_data_category_change",
  "business_data_checkout_click",
  "business_data_checkout_error",
  "business_data_pin_drop",
  "business_data_preview_download",
  "business_data_map_image_download",
  "business_data_radius_change",
  "business_data_result_click",
  "business_data_search_error",
  "business_data_search_submit",
  "business_data_search_success",
  "business_data_suggestion_select",
  "human_layer_action_click",
  "visitor_pathfinder_click",
  "meme_download",
  "share_caption_copy",
  "social_image_download",
  "session_ping",
  "session_end"
]);

function sanitizeText(value: unknown, max = 500) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).trim().slice(0, max) || null;
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);

  return Object.fromEntries(
    entries.map(([key, entryValue]) => [
      key.slice(0, 64),
      typeof entryValue === "string"
        ? entryValue.slice(0, 500)
        : typeof entryValue === "number" || typeof entryValue === "boolean"
          ? entryValue
          : String(entryValue).slice(0, 500)
    ])
  );
}

async function readTrackBody(request: Request) {
  const text = await request.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await readTrackBody(request);
    const bodyRecord = body as {
      event?: string;
      visitor_id?: string;
      session_id?: string;
      page_path?: string;
      page_title?: string;
      referrer?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_term?: string;
      utm_content?: string;
      article_id?: string;
      article_slug?: string;
      category?: string;
      device_type?: string;
      viewport_width?: number;
      viewport_height?: number;
      timezone?: string;
      language?: string;
      metadata?: Record<string, unknown>;
    };

    const eventName = sanitizeText(bodyRecord.event, 80);

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    }

    const visitorId = sanitizeText(bodyRecord.visitor_id, 80);
    const sessionId = sanitizeText(bodyRecord.session_id, 80);

    if (!visitorId || !sessionId) {
      return NextResponse.json(
        { error: "visitor_id and session_id are required." },
        { status: 400 }
      );
    }

    const pagePath = sanitizeText(bodyRecord.page_path, 240) || "/";
    const parsedArticle = parseArticlePath(pagePath);
    const userAgent = request.headers.get("user-agent");

    if (isLikelyBotUserAgent(userAgent)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const ip = getClientIp(request);

    if (isExcludedAnalyticsIp(ip)) {
      return NextResponse.json({ ok: true, skipped: "excluded_ip" });
    }

    const { error } = await supabase.from("visitor_events").insert({
      event_name: eventName,
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: pagePath,
      page_title: sanitizeText(bodyRecord.page_title, 240),
      referrer: sanitizeText(bodyRecord.referrer, 500),
      utm_source: sanitizeText(bodyRecord.utm_source, 120),
      utm_medium: sanitizeText(bodyRecord.utm_medium, 120),
      utm_campaign: sanitizeText(bodyRecord.utm_campaign, 120),
      utm_term: sanitizeText(bodyRecord.utm_term, 120),
      utm_content: sanitizeText(bodyRecord.utm_content, 120),
      article_id: sanitizeText(bodyRecord.article_id, 80),
      article_slug:
        sanitizeText(bodyRecord.article_slug, 120) ?? parsedArticle.articleSlug,
      category: sanitizeText(bodyRecord.category, 80) ?? parsedArticle.category,
      metadata: sanitizeMetadata(bodyRecord.metadata),
      country: sanitizeText(request.headers.get("x-vercel-ip-country"), 8),
      region: sanitizeText(
        request.headers.get("x-vercel-ip-country-region"),
        32
      ),
      city: sanitizeText(request.headers.get("x-vercel-ip-city"), 80),
      ip_hash: hashTrackingValue(ip),
      user_agent_hash: hashTrackingValue(userAgent),
      device_type: sanitizeText(bodyRecord.device_type, 40),
      viewport_width:
        typeof bodyRecord.viewport_width === "number"
          ? Math.round(bodyRecord.viewport_width)
          : null,
      viewport_height:
        typeof bodyRecord.viewport_height === "number"
          ? Math.round(bodyRecord.viewport_height)
          : null,
      timezone: sanitizeText(bodyRecord.timezone, 80),
      language: sanitizeText(bodyRecord.language, 40),
      host: sanitizeText(request.headers.get("host"), 120)
    });

    if (error) {
      console.error("Failed to track visitor event", error);
      return NextResponse.json({ error: "Tracking failed." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Visitor analytics track error", error);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
