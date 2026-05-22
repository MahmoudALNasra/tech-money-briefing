"use client";

import Script from "next/script";

import { useDataLayer } from "@/hooks/useDataLayer";

const adClient = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT;
const adSlot = process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT_NATIVE;
const shouldRenderLiveAd =
  process.env.NODE_ENV === "production" &&
  adClient &&
  adSlot &&
  !adClient.includes("0000000000000000") &&
  !adSlot.includes("0000000000");

type NativeAdCardProps = {
  slotIndex: number;
};

export function NativeAdCard({ slotIndex }: NativeAdCardProps) {
  const pushToDataLayer = useDataLayer();

  return (
    <article
      className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      onClick={() =>
        pushToDataLayer({
          event: "ad_click",
          ad_slot: adSlot,
          slot_index: slotIndex
        })
      }
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
          Sponsored
        </span>
        {shouldRenderLiveAd ? (
          <ins
            className="adsbygoogle block h-full w-full"
            style={{ display: "block" }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="fluid"
            data-ad-layout-key="-fb+5w+4e-db+86"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-semibold text-gray-500">
            Native sponsor placement
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
          Partner
        </span>
        <h2 className="line-clamp-3 text-lg font-bold leading-tight text-ink">
          Recommended by our sponsors
        </h2>
        <p className="line-clamp-2 text-sm leading-6 text-muted">
          Native placement reserved at render time to prevent layout shifts.
        </p>
      </div>

      {shouldRenderLiveAd ? (
        <Script id={`native-ad-${slotIndex}`} strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
      ) : null}
    </article>
  );
}
