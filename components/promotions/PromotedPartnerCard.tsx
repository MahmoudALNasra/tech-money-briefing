"use client";

import Link from "next/link";

import { useDataLayer } from "@/hooks/useDataLayer";

type PromotedPartnerCardProps = {
  placementIndex: number;
};

const promoTitle =
  process.env.NEXT_PUBLIC_PROMO_TITLE ??
  "Promote your product to AI decision makers";
const promoDescription =
  process.env.NEXT_PUBLIC_PROMO_DESCRIPTION ??
  "Reach operators, founders, and technical buyers reading high-intent industry analysis.";
const promoCta = process.env.NEXT_PUBLIC_PROMO_CTA ?? "Sponsor this briefing";
const promoUrl = process.env.NEXT_PUBLIC_PROMO_URL ?? "mailto:sponsor@example.com";
const promoBadge = process.env.NEXT_PUBLIC_PROMO_BADGE ?? "Partner Slot";

export function PromotedPartnerCard({
  placementIndex
}: PromotedPartnerCardProps) {
  const pushToDataLayer = useDataLayer();

  return (
    <aside className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-900">
          {promoBadge}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Native Promotion
        </span>
      </div>

      <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">
        {promoTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
        {promoDescription}
      </p>

      <Link
        href={promoUrl}
        className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
        onClick={() =>
          pushToDataLayer({
            event: "promotion_click",
            placement_index: placementIndex,
            promo_title: promoTitle,
            promo_url: promoUrl
          })
        }
      >
        {promoCta}
      </Link>
    </aside>
  );
}
