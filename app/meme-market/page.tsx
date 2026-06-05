import type { Metadata } from "next";

import { MemeMarket } from "@/components/games/MemeMarket";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CORE_CATEGORIES } from "@/lib/categories";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Meme Market",
  description: `A hidden meme trading game from ${siteConfig.name}. Buy and sell cursed internet trends before they become cringe.`,
  robots: {
    index: false,
    follow: false
  }
};

export default function MemeMarketPage() {
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
              Buy the meme. Sell before it becomes cringe.
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              A ridiculous timing game where fake internet assets pump, dump,
              and die while you pretend this is a market.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <MemeMarket />
        </section>
      </main>
    </>
  );
}
