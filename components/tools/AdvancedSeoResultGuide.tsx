"use client";

import { HowToReadCard, SignalCards } from "@/components/human/HumanBlocks";
import { getToolHumanLayer } from "@/lib/human-layer";

const TOOL_HREFS: Record<
  "keyword-cluster" | "serp-intent" | "content-gap",
  string
> = {
  "keyword-cluster": "/keyword-cluster-tool",
  "serp-intent": "/serp-intent-analyzer",
  "content-gap": "/content-gap-finder"
};

export function AdvancedSeoResultGuide({
  tool
}: {
  tool: "keyword-cluster" | "serp-intent" | "content-gap";
}) {
  const href = TOOL_HREFS[tool];
  const layer = getToolHumanLayer(href, "Advanced SEO tool");

  return (
    <div className="space-y-5 border-t border-stone-200 pt-5">
      <HowToReadCard items={layer.howToRead} />
      <SignalCards good={layer.goodSignal} bad={layer.badSignal} />
    </div>
  );
}
