"use client";

import { useMemo, useState } from "react";

import { GeneratorShell } from "@/components/tools/TextGenerators";

const youtubeFrames = [
  "Why {topic} is exploding right now",
  "{topic} explained in 60 seconds",
  "The truth about {topic}",
  "Nobody is talking about {topic}",
  "What {topic} means for creators",
  "I tried {topic} so you don't have to",
  "{topic}: what changed this week",
  "The {topic} update everyone missed"
];

const tiktokHooks = [
  "Stop scrolling if you care about {topic}",
  "This is why {topic} is trending",
  "3 things about {topic} nobody explains",
  "If you publish content, watch {topic}",
  "The fastest way to understand {topic}",
  "POV: you just discovered {topic}",
  "Why {topic} matters for money online",
  "The {topic} mistake creators keep making"
];

const blogFrames = [
  "The complete guide to {topic}",
  "What is {topic}? A practical breakdown",
  "How {topic} affects online revenue",
  "Why {topic} matters for publishers",
  "The hidden economics of {topic}",
  "Is {topic} worth your attention?",
  "What changed with {topic} in 2026",
  "A founder's guide to {topic}"
];

const metaFrames = [
  "Learn what {topic} means, why it is trending, and what creators should do next.",
  "A practical guide to {topic} for publishers, founders, and marketers.",
  "Understand {topic} with clear context, search intent, and next steps.",
  "What {topic} means for traffic, monetization, and content strategy."
];

function TopicGenerator({
  frames,
  inputLabel,
  buttonLabel,
  defaultTopic
}: {
  frames: string[];
  inputLabel: string;
  buttonLabel: string;
  defaultTopic: string;
}) {
  const [topic, setTopic] = useState(defaultTopic);
  const [seed, setSeed] = useState(0);

  const items = useMemo(
    () =>
      frames.map((frame, index) =>
        frame.replace("{topic}", topic).replace(
          /\s+/g,
          " "
        ) + (index % 2 === seed % 2 ? "" : "")
      ),
    [frames, seed, topic]
  );

  return (
    <GeneratorShell
      inputLabel={inputLabel}
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel={buttonLabel}
      onGenerate={() => setSeed((value) => value + 1)}
      items={items}
    />
  );
}

export function YoutubeTitleGenerator() {
  return (
    <TopicGenerator
      frames={youtubeFrames}
      inputLabel="Video topic or keyword"
      buttonLabel="Generate YouTube titles"
      defaultTopic="newsletter monetization"
    />
  );
}

export function TiktokHookGenerator() {
  return (
    <TopicGenerator
      frames={tiktokHooks}
      inputLabel="Video topic or keyword"
      buttonLabel="Generate TikTok hooks"
      defaultTopic="AdSense RPM"
    />
  );
}

export function BlogTitleGenerator() {
  return (
    <TopicGenerator
      frames={blogFrames}
      inputLabel="Blog topic or keyword"
      buttonLabel="Generate blog titles"
      defaultTopic="Google Trends traffic"
    />
  );
}

export function MetaDescriptionGenerator() {
  const [topic, setTopic] = useState("newsletter monetization");
  const [seed, setSeed] = useState(0);

  const items = useMemo(
    () =>
      metaFrames.map((frame, index) =>
        frame.replace("{topic}", topic) + (index % 2 === seed % 2 ? "" : "")
      ),
    [seed, topic]
  );

  return (
    <GeneratorShell
      inputLabel="Page topic or keyword"
      inputValue={topic}
      onInputChange={setTopic}
      buttonLabel="Generate meta descriptions"
      onGenerate={() => setSeed((value) => value + 1)}
      items={items}
    />
  );
}

export function UtmBuilder() {
  const [url, setUrl] = useState("https://techrevenuebrief.com/tools");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState("meme-generator");

  const builtUrl = useMemo(() => {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("utm_source", source.trim() || "source");
      parsed.searchParams.set("utm_medium", medium.trim() || "medium");
      parsed.searchParams.set("utm_campaign", campaign.trim() || "campaign");
      return parsed.toString();
    } catch {
      return "";
    }
  }, [campaign, medium, source, url]);

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-semibold text-stone-700">
          Destination URL
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          utm_source
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          utm_medium
          <input
            value={medium}
            onChange={(event) => setMedium(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          utm_campaign
          <input
            value={campaign}
            onChange={(event) => setCampaign(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-ink p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
          Generated URL
        </p>
        <p className="mt-3 break-all text-sm leading-7 text-stone-100">
          {builtUrl || "Enter a valid destination URL to generate a tracking link."}
        </p>
      </div>
    </div>
  );
}

export function RobotsTxtGenerator() {
  const [siteUrl, setSiteUrl] = useState("https://techrevenuebrief.com");
  const [allowAll, setAllowAll] = useState(true);
  const [sitemapUrl, setSitemapUrl] = useState("https://techrevenuebrief.com/sitemap.xml");

  const robotsTxt = useMemo(() => {
    const lines = [
      `User-agent: *`,
      allowAll ? "Allow: /" : "Disallow: /",
      "",
      `Sitemap: ${sitemapUrl.trim()}`
    ];
    return lines.join("\n");
  }, [allowAll, sitemapUrl]);

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-semibold text-stone-700">
          Site URL
          <input
            value={siteUrl}
            onChange={(event) => setSiteUrl(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          Sitemap URL
          <input
            value={sitemapUrl}
            onChange={(event) => setSitemapUrl(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </label>
        <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={allowAll}
            onChange={(event) => setAllowAll(event.target.checked)}
            className="h-4 w-4 rounded border-stone-300"
          />
          Allow all crawlers
        </label>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-stone-900 p-6 text-stone-100 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
          robots.txt preview
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-7">
          {robotsTxt}
        </pre>
      </div>
    </div>
  );
}
