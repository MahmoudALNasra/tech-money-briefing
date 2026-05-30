"use client";

import { useState } from "react";

import {
  ContentGapResults,
  KeywordClusterResults,
  SerpIntentResults
} from "@/components/tools/AdvancedSeoResults";

type SeoTool = "keyword-cluster" | "serp-intent" | "content-gap";

type AdvancedSeoToolProps = {
  tool: SeoTool;
  defaultKeyword: string;
};

function toolCopy(tool: SeoTool) {
  if (tool === "keyword-cluster") {
    return {
      button: "Build keyword clusters",
      helper:
        "Uses OpenAI plus Google autocomplete suggestions to group terms by search intent."
    };
  }

  if (tool === "serp-intent") {
    return {
      button: "Analyze SERP intent",
      helper:
        "Uses Serper.dev for live Google SERP data when configured, then summarizes dominant intent and content gaps."
    };
  }

  return {
    button: "Find content gaps",
    helper:
      "Fetches your page and competitor pages, then uses AI to find missing sections, FAQs, and improvements."
  };
}

export function AdvancedSeoTool({
  tool,
  defaultKeyword
}: AdvancedSeoToolProps) {
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [yourUrl, setYourUrl] = useState("https://techrevenuebrief.com/tools");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const copy = toolCopy(tool);

  const runTool = async () => {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/tools/advanced-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          keyword,
          yourUrl,
          competitorUrls: competitorUrls
            .split(/\n|,/)
            .map((url) => url.trim())
            .filter(Boolean)
        })
      });

      const json = (await response.json()) as unknown;

      if (!response.ok) {
        const message =
          typeof json === "object" && json && "error" in json
            ? String((json as { error: unknown }).error)
            : "Tool request failed.";
        throw new Error(message);
      }

      setResult(json);
    } catch (toolError) {
      setError(toolError instanceof Error ? toolError.message : String(toolError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm leading-6 text-stone-600">{copy.helper}</p>
        <label className="mt-5 block text-sm font-semibold text-stone-700">
          Keyword or topic
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 outline-none ring-stone-200 transition focus:ring-4"
          />
        </label>

        {tool === "content-gap" ? (
          <>
            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Your page URL
              <input
                value={yourUrl}
                onChange={(event) => setYourUrl(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 outline-none ring-stone-200 transition focus:ring-4"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Competitor URLs
              <textarea
                value={competitorUrls}
                onChange={(event) => setCompetitorUrls(event.target.value)}
                rows={5}
                placeholder="One URL per line"
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 outline-none ring-stone-200 transition focus:ring-4"
              />
            </label>
          </>
        ) : null}

        <button
          type="button"
          onClick={runTool}
          disabled={isLoading}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-400"
        >
          {isLoading ? "Running analysis..." : copy.button}
        </button>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="min-h-[320px]">
        {result ? (
          <div className="transition-opacity duration-500">
            {tool === "keyword-cluster" ? (
              <KeywordClusterResults
                result={result as Parameters<typeof KeywordClusterResults>[0]["result"]}
                keyword={keyword}
              />
            ) : null}
            {tool === "serp-intent" ? (
              <SerpIntentResults
                result={result as Parameters<typeof SerpIntentResults>[0]["result"]}
                keyword={keyword}
              />
            ) : null}
            {tool === "content-gap" ? (
              <ContentGapResults
                result={result as Parameters<typeof ContentGapResults>[0]["result"]}
                keyword={keyword}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 opacity-80" />
            <p className="mt-4 max-w-md text-sm leading-7 text-stone-600">
              Run the tool to generate an SEO analysis. Results appear as structured
              cards with next-step links to related tools.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
