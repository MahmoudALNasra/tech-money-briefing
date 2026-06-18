import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { DoomscrollDodge } from "@/components/games/DoomscrollDodge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Doomscroll Dodge",
  description: `A hidden brainrot dodging game from ${siteConfig.name}. Catch revenue signals and avoid fake gurus, bots, ragebait, and AI slop.`,
  path: "/doomscroll-dodge",
  robots: {
    index: false,
    follow: false
  }
});

export default function DoomscrollDodgePage() {
  return (
    <>
      <SiteHeader categories={[...getPublicNavCategories()]} />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Hidden Internet Game
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Dodge the doomscroll. Catch the signal.
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              A silly feed survival game. Avoid brainrot, collect useful
              signals, and try not to get converted by a fake guru.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <DoomscrollDodge />
        </section>
      </main>
    </>
  );
}
