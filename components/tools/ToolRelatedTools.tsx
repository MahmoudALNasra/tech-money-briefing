import Link from "next/link";

import { ToolCard } from "@/components/tools/ToolCard";
import { getRelatedTools } from "@/lib/tool-pages";

type ToolRelatedToolsProps = {
  currentHref: string;
};

export function ToolRelatedTools({ currentHref }: ToolRelatedToolsProps) {
  const related = getRelatedTools(currentHref, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-24" id="related-tools">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
            Next steps
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">Related free tools</h2>
        </div>
        <Link
          href="/tools"
          className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 transition hover:text-ink"
        >
          All tools
        </Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {related.map((tool) => (
          <ToolCard key={tool.href} tool={tool} compact />
        ))}
      </div>
    </section>
  );
}
