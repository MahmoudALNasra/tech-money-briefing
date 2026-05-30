import Link from "next/link";

import { getToolPageSeo, isPriorityTool } from "@/lib/tool-pages";

type ToolPageNavProps = {
  toolHref: string;
};

const priorityAnchors = [
  { id: "what-it-solves", label: "Problem" },
  { id: "how-to-use", label: "How to" },
  { id: "related-tools", label: "Related" },
  { id: "faq", label: "FAQ" }
];

export function ToolPageNav({ toolHref }: ToolPageNavProps) {
  if (!isPriorityTool(toolHref)) {
    return (
      <nav
        className="mb-8 flex flex-wrap items-center gap-3 text-sm"
        aria-label="Tool navigation"
      >
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 font-bold text-ink transition hover:border-ink hover:shadow-sm"
        >
          <span aria-hidden="true">←</span>
          All tools
        </Link>
      </nav>
    );
  }

  const seo = getToolPageSeo(toolHref);

  return (
    <div className="mb-8 space-y-4">
      <nav
        className="flex flex-wrap items-center gap-2 text-sm text-stone-500"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="font-semibold transition hover:text-ink">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/tools" className="font-semibold transition hover:text-ink">
          Tools
        </Link>
        {seo ? (
          <>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-ink">{seo.primaryKeyword}</span>
          </>
        ) : null}
      </nav>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-ink transition hover:border-ink"
        >
          ← Tools hub
        </Link>
        {priorityAnchors.map((anchor) => (
          <a
            key={anchor.id}
            href={`#${anchor.id}`}
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-600 transition hover:border-ink hover:bg-white hover:text-ink"
          >
            {anchor.label}
          </a>
        ))}
      </div>
    </div>
  );
}
