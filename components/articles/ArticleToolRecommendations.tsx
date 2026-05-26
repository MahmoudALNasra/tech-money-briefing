import { ToolCard } from "@/components/tools/ToolCard";
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
    <aside className="mt-10 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
        Useful tools
      </p>
      <h2 className="mt-3 text-xl font-black tracking-tight text-ink">
        Turn this trend into traffic
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        These free tools match the topic where possible. For broader news,
        sports, or random trends, use the fallback tools to create headlines,
        hooks, memes, or social posts around the moment.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {toolCards.map((tool) => (
          <ToolCard key={tool.href} tool={tool} compact />
        ))}
      </div>
    </aside>
  );
}
