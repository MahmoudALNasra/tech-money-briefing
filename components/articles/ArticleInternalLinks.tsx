import Link from "next/link";

import { getInternalLinksForArticle } from "@/lib/internal-links";
import type { Article } from "@/lib/types";

type ArticleInternalLinksProps = {
  article: Article;
};

const typeLabels = {
  comparison: "Comparison",
  article: "Briefing",
  tool: "Free tool",
  hub: "Explore"
} as const;

export async function ArticleInternalLinks({ article }: ArticleInternalLinksProps) {
  const items = await getInternalLinksForArticle(article);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="mt-10 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
        More on this site
      </p>
      <h2 className="mt-3 text-xl font-black tracking-tight text-ink">
        Related pages worth reading next
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        Internal links to tools, comparisons, and related briefings that match
        this topic.
      </p>

      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-emerald-100 bg-white p-4 transition hover:border-emerald-300"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                {typeLabels[item.type]}
              </p>
              <p className="mt-2 font-bold text-ink">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                {item.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
