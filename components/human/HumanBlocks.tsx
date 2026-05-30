"use client";

import Link from "next/link";

import { useDataLayer } from "@/hooks/useDataLayer";
import type { HumanAction } from "@/lib/human-layer";

type BlockProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  accent?: "emerald" | "sky" | "amber" | "indigo";
};

const accentStyles = {
  emerald: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-stone-50",
  sky: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-stone-50",
  amber: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50",
  indigo: "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-stone-50"
};

const eyebrowStyles = {
  emerald: "text-emerald-800 bg-emerald-100",
  sky: "text-sky-800 bg-sky-100",
  amber: "text-amber-800 bg-amber-100",
  indigo: "text-indigo-800 bg-indigo-100"
};

function HumanBlock({
  eyebrow,
  title,
  children,
  accent = "emerald"
}: BlockProps) {
  return (
    <section
      className={`not-prose overflow-hidden rounded-[1.75rem] border shadow-sm ${accentStyles[accent]}`}
    >
      <div className="border-b border-black/5 px-5 py-4 sm:px-6">
        <p
          className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${eyebrowStyles[accent]}`}
        >
          {eyebrow}
        </p>
        <h2 className="mt-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function PlainEnglishCard({
  text,
  trackingContext
}: {
  text: string;
  trackingContext?: string;
}) {
  return (
    <HumanBlock eyebrow="Plain English" title="What this means" accent="sky">
      <p className="text-base leading-8 text-stone-700">{text}</p>
      {trackingContext ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          {trackingContext}
        </p>
      ) : null}
    </HumanBlock>
  );
}

export function WhoShouldCareCard({ items }: { items: string[] }) {
  return (
    <HumanBlock eyebrow="Audience" title="Who should care" accent="indigo">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-stone-700">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </HumanBlock>
  );
}

export function OperatorTakeCard({ text }: { text: string }) {
  return (
    <HumanBlock eyebrow="Operator take" title="What we would do" accent="emerald">
      <p className="text-base font-semibold leading-8 text-stone-800">{text}</p>
    </HumanBlock>
  );
}

export function ChecklistCard({
  title,
  items,
  tone = "emerald"
}: {
  title: string;
  items: string[];
  tone?: "emerald" | "amber";
}) {
  return (
    <HumanBlock
      eyebrow={tone === "amber" ? "Watch out" : "Action plan"}
      title={title}
      accent={tone}
    >
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-stone-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-ink shadow-sm">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    </HumanBlock>
  );
}

export function ExampleScenarioCard({
  title,
  setup,
  outcome
}: {
  title: string;
  setup: string;
  outcome: string;
}) {
  return (
    <HumanBlock eyebrow="Example" title={title} accent="amber">
      <div className="space-y-4 text-sm leading-7 text-stone-700">
        <div className="rounded-2xl border border-amber-100 bg-white/80 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Setup
          </p>
          <p className="mt-2">{setup}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            What we would do next
          </p>
          <p className="mt-2 font-semibold text-stone-800">{outcome}</p>
        </div>
      </div>
    </HumanBlock>
  );
}

export function NextActionCards({
  actions,
  source
}: {
  actions: HumanAction[];
  source: string;
}) {
  const pushToDataLayer = useDataLayer();

  return (
    <HumanBlock eyebrow="Next steps" title="Turn this into action" accent="indigo">
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            onClick={() =>
              pushToDataLayer({
                event: "human_layer_action_click",
                source,
                destination_href: action.href,
                destination_label: action.label
              })
            }
            className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
              action.variant === "primary"
                ? "border-ink bg-ink text-white hover:bg-stone-800"
                : "border-stone-200 bg-white text-ink hover:border-ink"
            }`}
          >
            <p className="text-sm font-black">{action.label}</p>
            <p
              className={`mt-2 text-xs leading-6 ${
                action.variant === "primary" ? "text-stone-200" : "text-stone-600"
              }`}
            >
              {action.description}
            </p>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-stone-500">
        Prefer a human review? Use the assistant button below or{" "}
        <Link href="/contact" className="font-semibold text-ink underline">
          contact us
        </Link>
        .
      </p>
    </HumanBlock>
  );
}

export function BeforeYouRunCard({ items }: { items: string[] }) {
  return (
    <HumanBlock eyebrow="Prep" title="Before you run this" accent="sky">
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-stone-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-ink shadow-sm">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    </HumanBlock>
  );
}

export function HowToReadCard({ items }: { items: string[] }) {
  return (
    <HumanBlock eyebrow="Read results" title="How to interpret the output" accent="sky">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-stone-700">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </HumanBlock>
  );
}

export function SignalCards({
  good,
  bad
}: {
  good: string;
  bad: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
          Good signal
        </p>
        <p className="mt-2 text-sm leading-7 text-stone-700">{good}</p>
      </div>
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">
          Weak signal
        </p>
        <p className="mt-2 text-sm leading-7 text-stone-700">{bad}</p>
      </div>
    </div>
  );
}
