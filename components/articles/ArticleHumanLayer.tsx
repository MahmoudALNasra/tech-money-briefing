import {
  ChecklistCard,
  ExampleScenarioCard,
  NextActionCards,
  OperatorTakeCard,
  PlainEnglishCard,
  WhoShouldCareCard
} from "@/components/human/HumanBlocks";
import { getArticleHumanLayer } from "@/lib/human-layer";
import type { Article } from "@/lib/types";

type ArticleHumanLayerProps = {
  article: Article;
  variant?: "intro" | "full";
};

export function ArticleHumanLayer({
  article,
  variant = "full"
}: ArticleHumanLayerProps) {
  const layer = getArticleHumanLayer(article);

  if (variant === "intro") {
    return (
      <div className="not-prose mt-8 space-y-5">
        <PlainEnglishCard
          text={layer.plainEnglish}
          trackingContext={`${article.category} briefing`}
        />
        <WhoShouldCareCard items={layer.whoShouldCare} />
      </div>
    );
  }

  return (
    <div className="not-prose mt-10 space-y-5">
      <OperatorTakeCard text={layer.operatorTake} />
      <ExampleScenarioCard
        title={layer.scenario.title}
        setup={layer.scenario.setup}
        outcome={layer.scenario.outcome}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChecklistCard title="What we would test first" items={layer.testFirst} />
        <ChecklistCard
          title="Mistakes to avoid"
          items={layer.mistakes}
          tone="amber"
        />
      </div>
      <NextActionCards
        actions={layer.nextActions}
        source={`article_${article.slug}`}
      />
    </div>
  );
}
