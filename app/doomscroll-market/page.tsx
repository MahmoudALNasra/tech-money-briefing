import type { Metadata } from "next";

import { DoomscrollMarket } from "@/components/games/DoomscrollMarket";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CORE_CATEGORIES } from "@/lib/categories";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Doomscroll Meme Market",
  description: `A hidden brainrot market game from ${siteConfig.name}. Buy good signals, dodge cursed feed objects, and try to keep your timeline alive.`,
  robots: {
    index: false,
    follow: false
  }
};

export default function DoomscrollMarketPage() {
  return (
    <>
      <SiteHeader categories={[...CORE_CATEGORIES]} />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Hidden Internet Game
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Buy the signal. Dodge the brainrot.
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              A fast brainrot market where every feed card is either useful
              signal or cursed content. Decide before the timer melts.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <DoomscrollMarket />
        </section>
      </main>
    </>
  );
}
