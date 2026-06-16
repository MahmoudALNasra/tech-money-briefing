"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ToolCard } from "@/components/tools/ToolCard";
import CountUp from "@/components/ui/CountUp";
import FadeContent from "@/components/ui/FadeContent";
import { FREE_TOOLS } from "@/lib/free-tools";
import {
  SUBSCRIPTION_CREDIT_GRANT,
  SUBSCRIPTION_PRICE_USD
} from "@/lib/business-data-token-config";
import {
  TOOL_CATEGORIES,
  TOOL_WORKFLOWS,
  type ToolCategory,
  getToolsByCategory
} from "@/lib/tool-pages";

type ToolsHubProps = {
  featuredToolHrefs: string[];
};

function getToolsByHref(hrefs: string[]) {
  return hrefs
    .map((href) => FREE_TOOLS.find((tool) => tool.href === href))
    .filter((tool): tool is (typeof FREE_TOOLS)[number] => Boolean(tool));
}

export function ToolsHub({ featuredToolHrefs }: ToolsHubProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const statsRef = useRef<HTMLDivElement>(null);
  const [isStatsInView, setIsStatsInView] = useState(false);
  const featuredTools = getToolsByHref(featuredToolHrefs);

  const filteredTools = useMemo(() => {
    if (activeCategory === "all") {
      return FREE_TOOLS;
    }

    return getToolsByCategory(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    const element = statsRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStatsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={statsRef} className="grid gap-5 md:grid-cols-3">
        {[
          [String(FREE_TOOLS.length), "free tools"],
          [String(TOOL_WORKFLOWS.length), "guided workflows"],
          ["0", "login required"]
        ].map(([value, label]) => (
          <div
            key={label}
            className="stat-box group transition duration-300 hover:-translate-y-1"
          >
            <div className="stat-number transition group-hover:scale-105" suppressHydrationWarning>
              {isStatsInView ? (
                <CountUp
                  to={Number(value)}
                  duration={Number(value) > 4 ? 1.4 : 0.9}
                  startWhen={isStatsInView}
                  separator=""
                  className="stat-count"
                />
              ) : (
                value
              )}
            </div>
            <div className="stat-label uppercase tracking-[0.22em]">
              {label}
            </div>
          </div>
        ))}
      </div>

      <section className="tool-featured-card mt-8 overflow-hidden text-white shadow-xl shadow-black/20 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              Lead list tool
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Build local business reports by location, radius, and category.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
              Start with a free preview, then choose how many businesses to process in a subscriber
              report. Billing uses business credits: ${SUBSCRIPTION_PRICE_USD} includes{" "}
              {SUBSCRIPTION_CREDIT_GRANT} credits (1 credit per processed business).
            </p>
          </div>
          <Link
            href="/leads"
            className="inline-flex w-full items-center justify-center rounded-[3px] bg-[var(--accent-green)] px-6 py-3 text-sm font-black text-[var(--bg-base)] transition hover:-translate-y-0.5 hover:bg-[#4ade80] lg:w-auto"
          >
            Open Business Data Generator
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Workflows
        </p>
        <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Start with a goal</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {TOOL_WORKFLOWS.map((workflow, index) => {
            const tools = getToolsByHref(workflow.toolHrefs);

            return (
              <article
                key={workflow.id}
                className="tool-card group overflow-hidden transition duration-500 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${workflow.accent}`}
                  aria-hidden="true"
                />
                <div className="p-6">
                  <h3 className="text-xl font-black text-[var(--text-primary)]">{workflow.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    {workflow.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tools.slice(0, 4).map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="rounded-full border border-white/[0.06] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                      >
                        {tool.title.replace(/^Free /i, "").slice(0, 28)}
                        {tool.title.length > 28 ? "…" : ""}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {featuredTools.map((tool) => (
          <FadeContent
            key={tool.href}
            blur={false}
            duration={0.45}
            delay={0.07}
            threshold={0.15}
            className="article-card-fade-wrapper"
          >
            <ToolCard tool={tool} featured />
          </FadeContent>
        ))}
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/monetization-checklist"
          className="tool-card transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="badge badge-seo w-fit">
            Problem-first
          </p>
          <h2 className="mt-3 text-xl font-black text-[var(--text-primary)]">
            Publisher monetization checklist
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            AdSense, affiliates, newsletter, and sponsorship gaps—fix what blocks revenue first.
          </p>
        </Link>
        <Link
          href="/monetization-audit"
          className="tool-card transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="badge badge-digital w-fit">
            Free review
          </p>
          <h2 className="mt-3 text-xl font-black text-[var(--text-primary)]">Monetization audit</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Submit your URL and goal—we reply with practical gaps, not generic advice.
          </p>
        </Link>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-dim)]">
              Browse
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">All tools</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              label="All"
            />
            {TOOL_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.id}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                label={cat.label}
              />
            ))}
          </div>
        </div>

        {activeCategory !== "all" ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {
              TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.description
            }
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool, index) => (
            <FadeContent
              key={tool.href}
              blur={false}
              duration={0.45}
              delay={Math.min(index * 0.07, 0.35)}
              threshold={0.15}
              className="article-card-fade-wrapper"
            >
              <ToolCard tool={tool} />
            </FadeContent>
          ))}
        </div>
      </section>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition duration-200 ${
        active
          ? "bg-[var(--accent-blue)] text-[var(--bg-base)] shadow-md"
          : "border border-white/[0.06] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

// Re-export inferCategory for client bundle - actually getToolsByCategory uses inferCategory internally
// ToolsHub imports getToolsByCategory which uses inferCategory - need to export inferCategory from tool-pages
// I used inferCategory in import but didn't use it - remove unused import
