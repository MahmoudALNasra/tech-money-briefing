"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
    image: "/pathfinder-traffic.svg",
    accent: "from-emerald-50 via-white to-lime-50",
    ring: "hover:border-emerald-300 hover:shadow-emerald-950/10"
  },
  {
    id: "serp",
    eyebrow: "SEO heavy",
    title: "See what Google is rewarding before you write.",
    description:
      "Analyze live SERP intent, dominant page types, and gaps you can use.",
    href: "/serp-intent-analyzer",
    cta: "Analyze SERP intent",
    image: "/pathfinder-serp.svg",
    accent: "from-indigo-50 via-white to-cyan-50",
    ring: "hover:border-indigo-300 hover:shadow-indigo-950/10"
  },
  {
    id: "gap",
    eyebrow: "Fix a page",
    title: "Find what competitors cover that your page misses.",
    description:
      "Compare URLs and get missing sections, FAQ gaps, and priority fixes.",
    href: "/content-gap-finder",
    cta: "Find content gaps",
    image: "/pathfinder-gap.svg",
    accent: "from-orange-50 via-white to-amber-50",
    ring: "hover:border-orange-300 hover:shadow-orange-950/10"
  },
  {
    id: "brief",
    eyebrow: "Publish faster",
    title: "Turn a keyword into a structured content brief.",
    description:
      "Create the outline, search angle, FAQs, and CTA before drafting.",
    href: "/content-brief-generator",
    cta: "Generate a brief",
    image: "/pathfinder-brief.svg",
    accent: "from-violet-50 via-white to-blue-50",
    ring: "hover:border-violet-300 hover:shadow-violet-950/10"
  },
  {
    id: "money",
    eyebrow: "Need revenue?",
    title: "Estimate what your traffic could actually earn.",
    description:
      "Model AdSense, RPM, and newsletter angles before adding more ad clutter.",
    href: "/adsense-revenue-calculator",
    cta: "Estimate revenue",
    image: "/pathfinder-revenue.svg",
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
    image: "/pathfinder-decision.svg",
    accent: "from-indigo-50 via-white to-sky-50",
    ring: "hover:border-indigo-300 hover:shadow-indigo-950/10"
  }
];

export function StartHerePathfinder() {
  const pushToDataLayer = useDataLayer();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const visiblePaths = useMemo(
    () =>
      [0, 1, 2].map((offset) => paths[(activeIndex + offset) % paths.length]),
    [activeIndex]
  );

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % paths.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-950 p-3 shadow-2xl shadow-stone-950/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.5fr]">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-stone-900 via-ink to-emerald-950 p-6 text-white">
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-5 right-5 hidden h-24 w-32 rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/20 sm:block"
          >
            <div className="h-3 w-16 rounded-full bg-emerald-200/80" />
            <div className="mt-4 grid grid-cols-3 items-end gap-2">
              <div className="h-8 rounded-t-xl bg-white/30" />
              <div className="h-12 rounded-t-xl bg-white/45" />
              <div className="h-16 rounded-t-xl bg-lime-300/80" />
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            Start here
          </p>
          <h2 className="relative mt-3 text-2xl font-black leading-tight tracking-tight">
            Pick your fastest useful click.
          </h2>
          <p className="relative mt-3 max-w-sm text-sm leading-7 text-stone-200">
            The cards rotate through our highest-intent tools: keyword maps,
            SERP intent, content gaps, briefs, revenue estimates, and tool
            comparisons.
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {paths.map((path, index) => (
              <button
                key={path.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition ${
                  index === activeIndex
                    ? "w-9 bg-lime-300"
                    : "w-2.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Show ${path.cta}`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {visiblePaths.map((path, index) => (
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
              className={`group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${path.accent} p-5 text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-xl ${path.ring}`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <span className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/70 blur-2xl transition group-hover:scale-150" />
              <span className="relative z-10 mb-4 block overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm">
                <Image
                  src={path.image}
                  alt=""
                  width={560}
                  height={360}
                  loading="lazy"
                  className="h-28 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </span>
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
