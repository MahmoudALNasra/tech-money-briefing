import {
  BeforeYouRunCard,
  ExampleScenarioCard,
  HowToReadCard,
  NextActionCards,
  OperatorTakeCard,
  SignalCards
} from "@/components/human/HumanBlocks";
import { getToolHumanLayer } from "@/lib/human-layer";

type ToolHumanLayerProps = {
  toolHref: string;
  toolTitle: string;
  variant?: "before" | "after" | "interpret";
};

export function ToolHumanLayer({
  toolHref,
  toolTitle,
  variant = "before"
}: ToolHumanLayerProps) {
  const layer = getToolHumanLayer(toolHref, toolTitle);

  if (variant === "before") {
    return (
      <div className="mb-8 space-y-5">
        <BeforeYouRunCard items={layer.beforeYouRun} />
        <OperatorTakeCard text={layer.operatorTake} />
      </div>
    );
  }

  if (variant === "interpret") {
    return (
      <div className="space-y-5">
        <HowToReadCard items={layer.howToRead} />
        <SignalCards good={layer.goodSignal} bad={layer.badSignal} />
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-5">
      <ExampleScenarioCard
        title={layer.scenario.title}
        setup={layer.scenario.setup}
        outcome={layer.scenario.outcome}
      />
      <NextActionCards actions={layer.nextActions} source={`tool_${toolHref}`} />
    </div>
  );
}
