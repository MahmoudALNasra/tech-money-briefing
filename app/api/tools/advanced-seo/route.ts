import { NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/openai";

type AdvancedSeoTool = "keyword-cluster" | "serp-intent" | "content-gap";

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
  relatedSearches?: Array<{ query?: string }>;
  peopleAlsoAsk?: Array<{ question?: string; snippet?: string; title?: string; link?: string }>;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function cleanKeyword(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanKeyword(value);
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function fetchGoogleAutocomplete(keyword: string) {
  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`,
      {
        headers: {
          "User-Agent": "TechRevenueBriefSeoTool/1.0"
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as [string, string[]];
    return unique(Array.isArray(json[1]) ? json[1] : []).slice(0, 12);
  } catch {
    return [];
  }
}

async function expandKeywordsWithOpenAI(keyword: string, autocomplete: string[]) {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an SEO keyword strategist. Return JSON only. Do not invent exact search volume or CPC."
      },
      {
        role: "user",
        content: JSON.stringify({
          keyword,
          autocomplete,
          instructions: [
            "Generate realistic keyword variants, long-tail queries, FAQ questions, and intent notes.",
            "Use autocomplete suggestions when available.",
            "Return JSON keys: primary, variants, longTail, faqQueries, intentNotes."
          ]
        })
      }
    ]
  });

  const parsed = JSON.parse(completion.choices[0]?.message.content ?? "{}") as {
    primary?: string;
    variants?: string[];
    longTail?: string[];
    faqQueries?: string[];
    intentNotes?: string[];
  };

  return {
    primary: cleanKeyword(parsed.primary) || keyword,
    variants: unique([...(parsed.variants ?? []), ...autocomplete]).slice(0, 16),
    longTail: unique(parsed.longTail ?? []).slice(0, 12),
    faqQueries: unique(parsed.faqQueries ?? []).slice(0, 10),
    intentNotes: unique(parsed.intentNotes ?? []).slice(0, 8)
  };
}

async function fetchSerp(keyword: string) {
  const apiKey = process.env.SERPER_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: keyword,
      gl: "us",
      hl: "en",
      num: 10
    }),
    signal: AbortSignal.timeout(30000)
  });

  const json = (await response.json()) as SerperResponse & Record<string, unknown>;

  if (!response.ok) {
    throw new Error(`Serper failed (${response.status}): ${JSON.stringify(json)}`);
  }

  return {
    organic:
      json.organic?.slice(0, 10).map((item) => ({
        title: item.title ?? "",
        url: item.link ?? "",
        domain: item.link ? safeHostname(item.link) : "",
        description: item.snippet ?? "",
        rank: item.position ?? null
      })) ?? [],
    relatedSearches: unique(json.relatedSearches?.map((item) => item.query ?? "") ?? []),
    peopleAlsoAsk:
      json.peopleAlsoAsk?.slice(0, 6).map((item) => ({
        question: item.question ?? "",
        snippet: item.snippet ?? "",
        title: item.title ?? "",
        url: item.link ?? ""
      })) ?? []
  };
}

async function fetchPageText(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TechRevenueBriefSeoTool/1.0 (+https://techrevenuebrief.com)"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      return "";
    }

    const html = await response.text();

    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return "";
  }
}

async function runKeywordCluster(keyword: string) {
  const autocomplete = await fetchGoogleAutocomplete(keyword);
  const plan = await expandKeywordsWithOpenAI(keyword, autocomplete);
  const keywords = unique([
    plan.primary,
    ...plan.variants,
    ...plan.longTail,
    ...plan.faqQueries
  ]);

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an SEO strategist. Return compact JSON with clusters, page recommendations, and content angles. Do not invent exact search volume, CPC, or keyword difficulty."
      },
      {
        role: "user",
        content: JSON.stringify({
          keyword,
          plan,
          autocomplete,
          keywords,
          instructions: [
            "Group keywords into 4-6 intent clusters.",
            "Recommend one primary page type per cluster.",
            "Estimate relative opportunity as low, medium, or high based on specificity and commercial intent only.",
            "Call out quick wins and avoid keyword stuffing.",
            "Return JSON keys: summary, clusters, quickWins, pagePlan."
          ]
        })
      }
    ]
  });

  return {
    provider: autocomplete.length > 0 ? "openai+google-autocomplete" : "openai",
    plan,
    autocomplete,
    analysis: JSON.parse(completion.choices[0]?.message.content ?? "{}")
  };
}

async function runSerpIntent(keyword: string) {
  const serp = await fetchSerp(keyword);

  if (!serp) {
    return {
      provider: "openai",
      needsSerper: true,
      analysis: {
        summary:
          "Add SERPER_API_KEY to unlock live Google SERP analysis.",
        recommendedIntent:
          "Use an explainer or comparison page until live SERP data is available."
      },
      serp: [],
      relatedSearches: [],
      peopleAlsoAsk: []
    };
  }

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze Google SERPs for SEO content strategy. Return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          keyword,
          serp: serp.organic,
          relatedSearches: serp.relatedSearches,
          peopleAlsoAsk: serp.peopleAlsoAsk,
          instructions: [
            "Classify search intent.",
            "Identify dominant page types.",
            "Find content gaps a smaller publisher can exploit.",
            "Return JSON keys: intent, dominantPageTypes, contentGaps, recommendedOutline, titleIdeas."
          ]
        })
      }
    ]
  });

  return {
    provider: "openai+serper",
    serp: serp.organic,
    relatedSearches: serp.relatedSearches,
    peopleAlsoAsk: serp.peopleAlsoAsk,
    analysis: JSON.parse(completion.choices[0]?.message.content ?? "{}")
  };
}

async function runContentGap(input: {
  keyword: string;
  yourUrl: string;
  competitorUrls: string[];
}) {
  const [yourText, ...competitorTexts] = await Promise.all([
    fetchPageText(input.yourUrl),
    ...input.competitorUrls.slice(0, 3).map((url) => fetchPageText(url))
  ]);

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You compare SEO pages for content gaps. Return JSON only. Do not fabricate facts; if the fetched text is thin, say so."
      },
      {
        role: "user",
        content: JSON.stringify({
          keyword: input.keyword,
          yourUrl: input.yourUrl,
          competitorUrls: input.competitorUrls.slice(0, 3),
          yourText,
          competitorTexts,
          instructions: [
            "Compare coverage, structure, FAQ depth, examples, and buyer/operator usefulness.",
            "Return JSON keys: summary, missingSections, weakSections, faqGaps, recommendedEdits, priorityFixes.",
            "Prioritize fixes that improve usefulness, not just word count."
          ]
        })
      }
    ]
  });

  return {
    provider: "openai+page-fetch",
    fetched: {
      yourPageChars: yourText.length,
      competitorPageChars: competitorTexts.map((text) => text.length)
    },
    analysis: JSON.parse(completion.choices[0]?.message.content ?? "{}")
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const tool = String(body.tool ?? "") as AdvancedSeoTool;
    const keyword = cleanKeyword(body.keyword);

    if (!keyword) {
      return badRequest("Keyword is required.");
    }

    if (tool === "keyword-cluster") {
      return NextResponse.json(await runKeywordCluster(keyword));
    }

    if (tool === "serp-intent") {
      return NextResponse.json(await runSerpIntent(keyword));
    }

    if (tool === "content-gap") {
      const yourUrl = String(body.yourUrl ?? "").trim();
      const competitorUrls = Array.isArray(body.competitorUrls)
        ? body.competitorUrls.map((url) => String(url).trim()).filter(Boolean)
        : [];

      if (!yourUrl || competitorUrls.length === 0) {
        return badRequest("Your URL and at least one competitor URL are required.");
      }

      return NextResponse.json(
        await runContentGap({ keyword, yourUrl, competitorUrls })
      );
    }

    return badRequest("Unknown SEO tool.");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
