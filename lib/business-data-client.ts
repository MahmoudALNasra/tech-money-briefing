"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function getOrCreateSessionKey() {
  if (typeof window === "undefined") {
    return "server";
  }

  const key = "trb-business-data-session";
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const created = window.crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export async function getBusinessDataAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-trb-session": getOrCreateSessionKey()
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchWalletBalance() {
  const headers = await getBusinessDataAuthHeaders();

  if (!headers.Authorization) {
    return null;
  }

  const response = await fetch("/api/business-data/wallet", { headers });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as { balance: number };
  return json.balance;
}
