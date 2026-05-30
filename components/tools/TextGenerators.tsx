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

const contentBriefFrames = [
  "Primary search intent: explain what {topic} means, who it is for, and the first decision the reader should make.",
  "Suggested H2: Quick Answer: {topic}",
  "Suggested H2: When {topic} matters most",
  "Suggested H2: Step-by-step workflow",
  "Suggested H2: Common mistakes to avoid",
  "Suggested FAQ: What is {topic}?",
  "Suggested FAQ: How do beginners use {topic}?",
  "Suggested CTA: Compare tools, calculate costs, or download a checklist."
];

const faqFrames = [
  "What is {topic}?",
  "How does {topic} work?",
  "Who should use {topic}?",
  "What are the biggest mistakes with {topic}?",
  "How much does {topic} cost?",
  "What is the fastest way to start with {topic}?",
  "What should you compare before choosing {topic}?",
  "Is {topic} worth it for small businesses?"
];

const linkedinFrames = [
  "Most people talk about {topic} like it is a tactic. It is really a decision system.\n\nThe useful question is not \"should we try it?\" It is: what would make this worth the time, budget, and focus?\n\nHere is the simple filter I use:",
  "If you are working on {topic}, do not start with tools.\n\nStart with the bottleneck:\n- Is the problem traffic?\n- Is it conversion?\n- Is it retention?\n- Is it positioning?\n\nThe right tool depends on the bottleneck.",
  "{topic} gets easier when you stop chasing every tactic and build one repeatable workflow.\n\nOne input.\nOne clear output.\nOne metric that tells you whether it worked.\n\nThat is usually enough to make progress.",
  "A practical way to evaluate {topic}:\n\n1. Write down the promise.\n2. Define the user or buyer.\n3. Estimate the upside.\n4. List the risk.\n5. Run the smallest useful test.\n\nSimple beats vague."
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

export function ContentBriefGenerator() {
  const [topic, setTopic] = useState("AI tools for market research");
  const [seed, setSeed] = useState(0);

  const brief = useMemo(() => {
    const rotated = contentBriefFrames
      .map(
        (_frame, index) =>
          contentBriefFrames[(index + seed) % contentBriefFrames.length]
      )
      .map((frame) => frame.replaceAll("{topic}", topic));

    return rotated.slice(0, 8);
  }, [seed, topic]);

  return (
    <GeneratorShell
      inputLabel="Keyword or article topic"
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel="Generate content brief"
      onGenerate={() => setSeed((value) => value + 1)}
      items={brief}
    />
  );
}

export function FaqGenerator() {
  const [topic, setTopic] = useState("newsletter monetization");
  const [seed, setSeed] = useState(0);

  const questions = useMemo(() => {
    return faqFrames
      .map((_frame, index) => faqFrames[(index + seed) % faqFrames.length])
      .map((frame) => frame.replaceAll("{topic}", topic))
      .slice(0, 8);
  }, [seed, topic]);

  return (
    <GeneratorShell
      inputLabel="Topic, keyword, or product"
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel="Generate FAQ questions"
      onGenerate={() => setSeed((value) => value + 1)}
      items={questions}
    />
  );
}

export function LinkedinPostGenerator() {
  const [topic, setTopic] = useState("AI search traffic");
  const [seed, setSeed] = useState(0);

  const posts = useMemo(() => {
    return linkedinFrames
      .map(
        (_frame, index) => linkedinFrames[(index + seed) % linkedinFrames.length]
      )
      .map((frame) => frame.replaceAll("{topic}", topic))
      .slice(0, 4);
  }, [seed, topic]);

  return (
    <GeneratorShell
      inputLabel="Post topic"
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel="Generate LinkedIn posts"
      onGenerate={() => setSeed((value) => value + 1)}
      items={posts}
    />
  );
}

export function GeneratorShell({
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
            className="whitespace-pre-line rounded-2xl border border-stone-200 bg-white p-5 text-left text-sm font-semibold leading-6 text-stone-800 shadow-sm transition hover:border-stone-400"
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
