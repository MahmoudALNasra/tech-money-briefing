import Link from "next/link";

import { FREE_TOOLS } from "@/lib/free-tools";
import type { Article } from "@/lib/types";
import { getRecommendedToolsForText } from "@/lib/tool-recommendations";

type ArticleToolRecommendationsProps = {
  article: Article;
};

export function ArticleToolRecommendations({
  article
}: ArticleToolRecommendationsProps) {
  const tools = getRecommendedToolsForText(
    [
      article.title,
      article.meta_description,
      article.category,
      article.key_takeaways.join(" "),
      article.content.slice(0, 1200)
    ].join(" "),
    4,
    true
  );

  if (tools.length === 0) {
    return null;
  }

  const toolCards = tools
    .map((tool) => FREE_TOOLS.find((freeTool) => freeTool.href === tool.href))
    .filter((tool): tool is (typeof FREE_TOOLS)[number] => Boolean(tool));

  return (
    <aside className="mt-10 rounded-md border border-white/[0.06] bg-[#f5efe3] p-5 text-slate-950">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
        Useful tools
      </p>
      <h2 className="mt-2 font-serif text-xl font-bold tracking-tight text-slate-950">
        Turn this trend into traffic
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        A few lightweight follow-up tools if you want to turn this briefing into
        a title, hook, campaign link, or local prospecting list.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {toolCards.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-md border border-slate-950/10 bg-white/55 px-3 py-2 transition hover:-translate-y-0.5 hover:border-slate-950/20 hover:bg-white"
          >
            <span className="block text-sm font-bold text-slate-950">
              {tool.title.replace(/^Free /i, "")}
            </span>
            <span className="mt-1 line-clamp-1 block text-xs text-slate-500">
              {tool.description}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-950/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Local business report
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Need a quiet next step? Build a local competitor list from this angle.
          </p>
        </div>
        <Link
          href={`/leads?source=${encodeURIComponent(`article_${article.category}_${article.slug}`)}`}
          className="inline-flex shrink-0 rounded-[3px] border border-slate-950/15 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-950/30 hover:text-slate-950"
        >
          Open Leads Tool
        </Link>
      </div>
    </aside>
  );
}
