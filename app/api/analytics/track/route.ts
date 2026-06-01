import { NextResponse } from "next/server";

import { isLikelyBotUserAgent } from "@/lib/bot-detection";
import {
  getClientIp,
  hashTrackingValue,
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
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

    const eventName = sanitizeText(body.event, 80);

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    }

    const visitorId = sanitizeText(body.visitor_id, 80);
    const sessionId = sanitizeText(body.session_id, 80);

    if (!visitorId || !sessionId) {
      return NextResponse.json(
        { error: "visitor_id and session_id are required." },
        { status: 400 }
      );
    }

    const pagePath = sanitizeText(body.page_path, 240) ?? "/";
    const parsedArticle = parseArticlePath(pagePath);
    const userAgent = request.headers.get("user-agent");

    if (isLikelyBotUserAgent(userAgent)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const ip = getClientIp(request);

    const { error } = await supabase.from("visitor_events").insert({
      event_name: eventName,
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: pagePath,
      page_title: sanitizeText(body.page_title, 240),
      referrer: sanitizeText(body.referrer, 500),
      utm_source: sanitizeText(body.utm_source, 120),
      utm_medium: sanitizeText(body.utm_medium, 120),
      utm_campaign: sanitizeText(body.utm_campaign, 120),
      utm_term: sanitizeText(body.utm_term, 120),
      utm_content: sanitizeText(body.utm_content, 120),
      article_id: sanitizeText(body.article_id, 80),
      article_slug:
        sanitizeText(body.article_slug, 120) ?? parsedArticle.articleSlug,
      category: sanitizeText(body.category, 80) ?? parsedArticle.category,
      metadata: sanitizeMetadata(body.metadata),
      country: sanitizeText(request.headers.get("x-vercel-ip-country"), 8),
      region: sanitizeText(
        request.headers.get("x-vercel-ip-country-region"),
        32
      ),
      city: sanitizeText(request.headers.get("x-vercel-ip-city"), 80),
      ip_hash: hashTrackingValue(ip),
      user_agent_hash: hashTrackingValue(userAgent),
      device_type: sanitizeText(body.device_type, 40),
      viewport_width:
        typeof body.viewport_width === "number"
          ? Math.round(body.viewport_width)
          : null,
      viewport_height:
        typeof body.viewport_height === "number"
          ? Math.round(body.viewport_height)
          : null,
      timezone: sanitizeText(body.timezone, 80),
      language: sanitizeText(body.language, 40),
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
