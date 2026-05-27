"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { REFERRAL_OFFERS } from "@/lib/referral-offers";

const STORAGE_KEY = "tech-revenue-brief-referral-nudge-dismissed-until";
const DISMISS_DAYS = 7;

function dismissedUntil(days: number) {
  return String(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function ReferralNudge() {
  const [isVisible, setIsVisible] = useState(false);
  const offer = useMemo(() => {
    const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return REFERRAL_OFFERS[day % REFERRAL_OFFERS.length];
  }, []);

  useEffect(() => {
    const dismissedValue = window.localStorage.getItem(STORAGE_KEY);
    const dismissedTimestamp = Number(dismissedValue);

    if (Number.isFinite(dismissedTimestamp) && dismissedTimestamp > Date.now()) {
      return;
    }

    const timer = window.setTimeout(() => setIsVisible(true), 14000);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss(days = DISMISS_DAYS) {
    window.localStorage.setItem(STORAGE_KEY, dismissedUntil(days));
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-emerald-200 bg-white p-5 shadow-2xl shadow-stone-950/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Referral Tip
          </p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">
            {offer.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => dismiss()}
          className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-600 transition hover:bg-stone-200"
          aria-label="Dismiss referral tip"
        >
          ×
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">{offer.description}</p>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Disclosure: this may be a referral link. It can support the site if you
        sign up through it.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={offer.articlePath}
          onClick={() => dismiss(14)}
          className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-700"
        >
          {offer.cta}
        </Link>
        <button
          type="button"
          onClick={() => dismiss()}
          className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
        >
          Maybe later
        </button>
      </div>
    </aside>
  );
}
