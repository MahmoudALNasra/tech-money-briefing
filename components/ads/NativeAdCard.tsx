"use client";

import { useEffect, useRef, useState } from "react";

import { useDataLayer } from "@/hooks/useDataLayer";

const configuredAdClient = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT;
const configuredAdSlot = process.env.NEXT_PUBLIC_GOOGLE_AD_SLOT_NATIVE;
const adClient =
  configuredAdClient && !configuredAdClient.includes("0000000000000000")
    ? configuredAdClient
    : "ca-pub-8203750015609502";
const adSlot =
  configuredAdSlot && !configuredAdSlot.includes("0000000000")
    ? configuredAdSlot
    : "8512522207";
const shouldRenderLiveAd =
  process.env.NODE_ENV === "production" && adClient && adSlot;

type NativeAdCardProps = {
  slotIndex: number;
};

function pushAdSlot() {
  const adsbygoogle = (
    window as Window & { adsbygoogle?: Array<Record<string, unknown>> }
  ).adsbygoogle;

  adsbygoogle?.push({});
}

export function NativeAdCard({ slotIndex }: NativeAdCardProps) {
  const pushToDataLayer = useDataLayer();
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adPushed, setAdPushed] = useState(false);

  useEffect(() => {
    const node = containerRef.current;

    if (!node || !shouldRenderLiveAd) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || adPushed || !shouldRenderLiveAd) {
      return;
    }

    const tryPush = () => {
      if (
        typeof window !== "undefined" &&
        (window as Window & { adsbygoogle?: unknown }).adsbygoogle
      ) {
        pushAdSlot();
        setAdPushed(true);
        return true;
      }

      return false;
    };

    if (tryPush()) {
      return;
    }

    const interval = window.setInterval(() => {
      if (tryPush()) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isVisible, adPushed]);

  return (
    <article
      ref={containerRef}
      className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      onClick={() =>
        pushToDataLayer({
          event: "ad_click",
          ad_slot: adSlot,
          slot_index: slotIndex
        })
      }
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        Sponsored
      </p>
      <div className="overflow-hidden rounded-xl bg-stone-50">
        {shouldRenderLiveAd && isVisible ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-format="fluid"
            data-ad-layout-key="-3q+dd+6a-et-7s"
            data-ad-client={adClient}
            data-ad-slot={adSlot}
          />
        ) : (
          <div className="flex min-h-32 items-center justify-center px-6 py-8 text-center text-sm font-semibold text-gray-500">
            Native in-feed AdSense placement
          </div>
        )}
      </div>
    </article>
  );
}
