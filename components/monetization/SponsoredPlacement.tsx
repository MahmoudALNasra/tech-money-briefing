"use client";

import Link from "next/link";

import { useDataLayer } from "@/hooks/useDataLayer";
import {
  getSponsorPlacement,
  type SponsorPlacementContext
} from "@/lib/sponsor-config";

type SponsoredPlacementProps = {
  context: SponsorPlacementContext;
  placementIndex: number;
};

export function SponsoredPlacement({
  context,
  placementIndex
}: SponsoredPlacementProps) {
  const placement = getSponsorPlacement(context);
  const pushToDataLayer = useDataLayer();
  const isPaid = placement.mode === "paid";

  return (
    <aside
      className={`rounded-2xl border p-6 shadow-sm ${
        isPaid
          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-stone-50"
          : "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
            isPaid
              ? "bg-indigo-100 text-indigo-900"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {placement.badge}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {isPaid ? "Sponsored" : "Advertise"}
        </span>
      </div>

      <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">
        {placement.title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
        {placement.description}
      </p>

      <Link
        href={placement.url}
        className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
        onClick={() =>
          pushToDataLayer({
            event: isPaid ? "sponsor_click" : "promotion_click",
            placement_index: placementIndex,
            placement_context: context,
            promo_title: placement.title,
            promo_url: placement.url
          })
        }
      >
        {placement.cta}
      </Link>
    </aside>
  );
}
