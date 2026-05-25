"use client";

import { useMemo, useState } from "react";

const startupPrefixes = [
  "Signal",
  "Ledger",
  "Prompt",
  "Revenue",
  "Stack",
  "Nimbus",
  "Vector",
  "Pixel",
  "Atlas",
  "Loop"
];

const startupSuffixes = [
  "ly",
  "base",
  "pilot",
  "flow",
  "grid",
  "labs",
  "forge",
  "desk",
  "cloud",
  "kit"
];

const subjectStarters = [
  "The quiet shift in",
  "Why everyone is watching",
  "The weird economics of",
  "What changed this week in",
  "The hidden cost of",
  "A practical guide to",
  "The fastest way to understand",
  "What founders miss about"
];

const headlineFrames = [
  "Why {topic} suddenly matters",
  "{topic}: the numbers nobody is watching",
  "The simple guide to {topic}",
  "How {topic} became a revenue problem",
  "What {topic} means for operators",
  "The hidden business model behind {topic}",
  "Is {topic} overhyped or underpriced?",
  "The next wave of {topic} is already here"
];

export function StartupNameGenerator() {
  const [keyword, setKeyword] = useState("AI media");
  const [seed, setSeed] = useState(0);

  const names = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const prefix = startupPrefixes[(index + seed) % startupPrefixes.length];
      const suffix = startupSuffixes[(index * 3 + seed) % startupSuffixes.length];
      const cleanKeyword = keyword
        .split(/\s+/)
        .filter(Boolean)[0]
        ?.replace(/[^a-z0-9]/gi, "");

      return `${cleanKeyword || prefix}${suffix}`.replace(/^./, (letter) =>
        letter.toUpperCase()
      );
    });
  }, [keyword, seed]);

  return (
    <GeneratorShell
      inputLabel="Startup idea or keyword"
      inputValue={keyword}
      onInputChange={setKeyword}
      buttonLabel="Generate startup names"
      onGenerate={() => setSeed((value) => value + 1)}
      items={names}
    />
  );
}

export function NewsletterSubjectGenerator() {
  const [topic, setTopic] = useState("AI search traffic");
  const [seed, setSeed] = useState(0);

  const subjects = useMemo(() => {
    return subjectStarters.map((starter, index) => {
      const ending =
        index % 3 === 0
          ? "before the market catches up"
          : index % 3 === 1
            ? "and what to do next"
            : "in five minutes";

      return `${starter} ${topic} ${ending}`;
    }).slice(seed % 2, 8 + (seed % 2));
  }, [seed, topic]);

  return (
    <GeneratorShell
      inputLabel="Newsletter topic"
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel="Generate subject lines"
      onGenerate={() => setSeed((value) => value + 1)}
      items={subjects}
    />
  );
}

export function AiHeadlineGenerator() {
  const [topic, setTopic] = useState("newsletter monetization");
  const [seed, setSeed] = useState(0);

  const headlines = useMemo(() => {
    return headlineFrames
      .map((frame, index) => {
        const suffix =
          index % 2 === seed % 2
            ? ""
            : " in 2026";
        return `${frame.replace("{topic}", topic)}${suffix}`;
      })
      .slice(0, 8);
  }, [seed, topic]);

  return (
    <GeneratorShell
      inputLabel="Article or social topic"
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel="Generate headlines"
      onGenerate={() => setSeed((value) => value + 1)}
      items={headlines}
    />
  );
}

function GeneratorShell({
  inputLabel,
  inputValue,
  onInputChange,
  buttonLabel,
  onGenerate,
  items
}: {
  inputLabel: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  buttonLabel: string;
  onGenerate: () => void;
  items: string[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyItem = async (item: string) => {
    await navigator.clipboard.writeText(item);
    setCopied(item);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-semibold text-stone-700">
          {inputLabel}
          <input
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
        <button
          type="button"
          onClick={onGenerate}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          {buttonLabel}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => copyItem(item)}
            className="rounded-2xl border border-stone-200 bg-white p-5 text-left text-sm font-semibold leading-6 text-stone-800 shadow-sm transition hover:border-stone-400"
          >
            {item}
            <span className="mt-3 block text-xs font-medium text-stone-500">
              {copied === item ? "Copied" : "Click to copy"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
