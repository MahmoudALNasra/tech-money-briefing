import type { Metadata } from "next";

import { BrushTheAlgorithm } from "@/components/games/BrushTheAlgorithm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brush the Algorithm",
  description: `A silly hidden browser game from ${siteConfig.name}. Brush the algorithm gremlin, survive the rage meter, then read real tech revenue briefings.`,
  robots: {
    index: false,
    follow: false
  }
};

export default function BrushTheAlgorithmPage() {
  return (
    <>
      <SiteHeader categories={[...getPublicNavCategories()]} />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Hidden Internet Nonsense
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Brush the algorithm before it gets angry.
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              A pointless little reflex game hiding behind a serious media site.
              Share it directly. It is not in the menu on purpose.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <BrushTheAlgorithm />
        </section>
      </main>
    </>
  );
}
