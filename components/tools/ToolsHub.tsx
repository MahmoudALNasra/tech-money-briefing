"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ToolCard } from "@/components/tools/ToolCard";
import { FREE_TOOLS } from "@/lib/free-tools";
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
  const featuredTools = getToolsByHref(featuredToolHrefs);

  const filteredTools = useMemo(() => {
    if (activeCategory === "all") {
      return FREE_TOOLS;
    }

    return getToolsByCategory(activeCategory);
  }, [activeCategory]);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          [String(FREE_TOOLS.length), "free tools"],
          [String(TOOL_WORKFLOWS.length), "guided workflows"],
          ["0", "login required"]
        ].map(([value, label]) => (
          <div
            key={label}
            className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl font-black text-ink transition group-hover:scale-105">
              {value}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
              {label}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          Workflows
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">Start with a goal</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {TOOL_WORKFLOWS.map((workflow, index) => {
            const tools = getToolsByHref(workflow.toolHrefs);

            return (
              <article
                key={workflow.id}
                className="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${workflow.accent}`}
                  aria-hidden="true"
                />
                <div className="p-6">
                  <h3 className="text-xl font-black text-ink">{workflow.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {workflow.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tools.slice(0, 4).map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-ink transition hover:border-ink hover:bg-white"
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
          <ToolCard key={tool.href} tool={tool} featured />
        ))}
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/monetization-checklist"
          className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
            Problem-first
          </p>
          <h2 className="mt-3 text-xl font-black text-ink">
            Publisher monetization checklist
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            AdSense, affiliates, newsletter, and sponsorship gaps—fix what blocks revenue first.
          </p>
        </Link>
        <Link
          href="/monetization-audit"
          className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
            Free review
          </p>
          <h2 className="mt-3 text-xl font-black text-ink">Monetization audit</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Submit your URL and goal—we reply with practical gaps, not generic advice.
          </p>
        </Link>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              Browse
            </p>
            <h2 className="mt-2 text-2xl font-black text-ink">All tools</h2>
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
          <p className="mt-3 text-sm text-stone-600">
            {
              TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.description
            }
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool, index) => (
            <div
              key={tool.href}
              className="transition duration-300 hover:-translate-y-1"
              style={{ transitionDelay: `${(index % 6) * 40}ms` }}
            >
              <ToolCard tool={tool} />
            </div>
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
          ? "bg-ink text-white shadow-md"
          : "border border-stone-200 bg-white text-stone-600 hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

// Re-export inferCategory for client bundle - actually getToolsByCategory uses inferCategory internally
// ToolsHub imports getToolsByCategory which uses inferCategory - need to export inferCategory from tool-pages
// I used inferCategory in import but didn't use it - remove unused import
