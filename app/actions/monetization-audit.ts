"use server";

import { supabase } from "@/lib/supabase";

type MonetizationAuditState = {
  ok: boolean;
  message: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const allowedGoals = new Set([
  "ads",
  "affiliate",
  "newsletter",
  "sponsorship",
  "mixed",
  "other"
]);

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function submitMonetizationAudit(
  formData: FormData
): Promise<MonetizationAuditState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const siteUrl = normalizeUrl(String(formData.get("site_url") ?? ""));
  const goal = String(formData.get("goal") ?? "").trim();
  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, 2000);
  const source = String(formData.get("source") ?? "audit_form")
    .trim()
    .slice(0, 80);

  if (!emailRegex.test(email)) {
    return {
      ok: false,
      message: "Please enter a valid email address."
    };
  }

  if (!siteUrl || siteUrl.length < 8) {
    return {
      ok: false,
      message: "Please enter your site URL."
    };
  }

  if (!allowedGoals.has(goal)) {
    return {
      ok: false,
      message: "Please choose a primary monetization goal."
    };
  }

  const { error } = await supabase.from("monetization_leads").insert({
    email,
    site_url: siteUrl,
    goal,
    notes: notes || null,
    source: source || "audit_form"
  });

  if (error) {
    console.error("[monetization-audit] insert failed", error.message);
    return {
      ok: false,
      message: "Could not submit right now. Please try again or email ads@techrevenuebrief.com."
    };
  }

  return {
    ok: true,
    message:
      "Received. We will review your site and reply with practical monetization gaps—not a generic pitch deck."
  };
}
