import type { Metadata } from "next";

import { RevenueClicker } from "@/components/games/RevenueClicker";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CORE_CATEGORIES } from "@/lib/categories";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Revenue Clicker",
  description: `A silly founder clicker game from ${siteConfig.name}. Build your internet business empire, then read real tech revenue briefings.`,
  robots: {
    index: true,
    follow: true
  }
};

export default function RevenueClickerPage() {
  return (
    <>
      <SiteHeader categories={[...CORE_CATEGORIES]} />
      <main className="bg-stone-50">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Easter Egg
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Build your empire. One click at a time.
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              Not in the menu on purpose. Share it, suffer through upgrade
              inflation, then go read something useful on {siteConfig.name}.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <RevenueClicker />
        </section>
      </main>
    </>
  );
}
