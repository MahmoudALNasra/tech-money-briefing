"use client";

import Link from "next/link";

import { useDataLayer } from "@/hooks/useDataLayer";

const paths = [
  {
    id: "traffic",
    eyebrow: "Need traffic?",
    title: "Find the page Google is most likely to reward.",
    description:
      "Cluster keywords, read intent, then build one useful page instead of guessing.",
    href: "/keyword-cluster-tool",
    cta: "Build a keyword map",
    accent: "from-emerald-50 via-white to-lime-50",
    ring: "hover:border-emerald-300 hover:shadow-emerald-950/10"
  },
  {
    id: "money",
    eyebrow: "Need revenue?",
    title: "Estimate what your traffic could actually earn.",
    description:
      "Model AdSense, RPM, and newsletter angles before adding more ad clutter.",
    href: "/adsense-revenue-calculator",
    cta: "Estimate revenue",
    accent: "from-amber-50 via-white to-orange-50",
    ring: "hover:border-amber-300 hover:shadow-amber-950/10"
  },
  {
    id: "decision",
    eyebrow: "Need a decision?",
    title: "Compare tools before you waste a month switching.",
    description:
      "Use practical comparisons and next-step cards to choose what to test first.",
    href: "/compare",
    cta: "Compare tools",
    accent: "from-indigo-50 via-white to-sky-50",
    ring: "hover:border-indigo-300 hover:shadow-indigo-950/10"
  }
];

export function StartHerePathfinder() {
  const pushToDataLayer = useDataLayer();

  return (
    <section className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-950 p-3 shadow-2xl shadow-stone-950/10">
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.5fr]">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-stone-900 via-ink to-emerald-950 p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            Start here
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight">
            Pick your fastest useful click.
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-200">
            Most visitors need one of three things: more traffic, more revenue,
            or a better tool decision. Choose the closest path and leave with a
            next step in under a minute.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {paths.map((path) => (
            <Link
              key={path.id}
              href={path.href}
              onClick={() =>
                pushToDataLayer({
                  event: "visitor_pathfinder_click",
                  pathfinder_id: path.id,
                  destination_href: path.href,
                  destination_label: path.cta
                })
              }
              className={`group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${path.accent} p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-xl ${path.ring}`}
            >
              <span className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/70 blur-2xl transition group-hover:scale-150" />
              <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                {path.eyebrow}
              </span>
              <span className="relative z-10 mt-3 block text-base font-black leading-tight text-ink">
                {path.title}
              </span>
              <span className="relative z-10 mt-3 block text-xs leading-6 text-stone-600">
                {path.description}
              </span>
              <span className="relative z-10 mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-xs font-black text-white transition group-hover:translate-x-1 group-hover:bg-stone-700">
                {path.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
