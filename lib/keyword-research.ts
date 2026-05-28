import { getOpenAIClient } from "./openai";

export type KeywordResearchProviderId = "openai" | "dataforseo";

export type KeywordMetrics = {
  search_volume?: number | null;
  cpc?: number | null;
  competition?: number | null;
};

export type KeywordResearchResult = {
  primary: string;
  variants: string[];
  misspellings: string[];
  longTail: string[];
  faqQueries: string[];
  intentNotes: string[];
  metrics?: Record<string, KeywordMetrics>;
  source: KeywordResearchProviderId;
};

export type KeywordResearchInput = {
  seed: string;
  category?: string;
  locale?: {
    languageCode?: string; // ex: "en"
    locationCode?: number; // DataForSEO location code (US=2840)
  };
  hints?: {
    brand?: string;
    isReferral?: boolean;
    referralUrl?: string;
  };
};

export type KeywordResearchProvider = {
  id: KeywordResearchProviderId;
  research: (input: KeywordResearchInput) => Promise<KeywordResearchResult>;
};

function uniq(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function clampList(values: string[], max = 12) {
  return uniq(values).slice(0, max);
}

function providerFromEnv(): KeywordResearchProviderId {
  const raw = (process.env.KEYWORD_RESEARCH_PROVIDER ?? "openai")
    .trim()
    .toLowerCase();
  return raw === "dataforseo" ? "dataforseo" : "openai";
}

export async function runKeywordResearch(
  input: KeywordResearchInput
): Promise<KeywordResearchResult> {
  const provider = providerFromEnv();

  if (provider === "dataforseo") {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (login && password) {
      try {
        return await dataForSeoKeywordResearch({ login, password }, input);
      } catch (error) {
        console.warn(
          "[keyword-research] DataForSEO failed; falling back to OpenAI",
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  return await openAiKeywordResearch(input);
}

async function openAiKeywordResearch(
  input: KeywordResearchInput
): Promise<KeywordResearchResult> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.25,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "keyword_research_plan",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            primary: { type: "string" },
            variants: { type: "array", items: { type: "string" }, minItems: 6 },
            misspellings: {
              type: "array",
              items: { type: "string" },
              minItems: 2
            },
            longTail: { type: "array", items: { type: "string" }, minItems: 4 },
            faqQueries: { type: "array", items: { type: "string" }, minItems: 4 },
            intentNotes: { type: "array", items: { type: "string" }, minItems: 3 }
          },
          required: [
            "primary",
            "variants",
            "misspellings",
            "longTail",
            "faqQueries",
            "intentNotes"
          ]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You are an SEO-focused keyword researcher. Return only valid JSON. Produce realistic query variants and misspellings that people actually type. Do not output a spammy keyword dump; focus on intent coverage."
      },
      {
        role: "user",
        content: JSON.stringify({
          seed: input.seed,
          category: input.category ?? "",
          brand: input.hints?.brand ?? "",
          isReferral: Boolean(input.hints?.isReferral),
          referralUrl: input.hints?.referralUrl ?? "",
          instructions: [
            "Choose one primary query that best matches the seed.",
            "Generate variants that cover head terms, near-synonyms, and signup/link intent.",
            "Include 2-6 realistic misspellings (e.g., Cursor -> Cursur).",
            "Generate long-tail queries that are more specific and likely to convert.",
            "Generate FAQ-style questions (4-8) that a page could answer.",
            "Intent notes should describe how to structure the page for the query and what to avoid."
          ]
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty keyword plan");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const primary = String(parsed.primary ?? "").trim() || input.seed.trim();
  const variants = clampList(
    Array.isArray(parsed.variants) ? parsed.variants.map((v) => String(v)) : [],
    14
  );
  const misspellings = clampList(
    Array.isArray(parsed.misspellings)
      ? parsed.misspellings.map((v) => String(v))
      : [],
    8
  );
  const longTail = clampList(
    Array.isArray(parsed.longTail) ? parsed.longTail.map((v) => String(v)) : [],
    14
  );
  const faqQueries = clampList(
    Array.isArray(parsed.faqQueries)
      ? parsed.faqQueries.map((v) => String(v))
      : [],
    10
  );
  const intentNotes = clampList(
    Array.isArray(parsed.intentNotes)
      ? parsed.intentNotes.map((v) => String(v))
      : [],
    10
  );

  return {
    primary,
    variants,
    misspellings,
    longTail,
    faqQueries,
    intentNotes,
    source: "openai"
  };
}

async function dataForSeoKeywordResearch(
  auth: { login: string; password: string },
  input: KeywordResearchInput
): Promise<KeywordResearchResult> {
  const locale = {
    languageCode: input.locale?.languageCode ?? "en",
    locationCode: input.locale?.locationCode ?? 2840
  };

  const autocomplete = await dataForSeoAutocomplete(auth, {
    query: input.seed,
    languageCode: locale.languageCode,
    locationCode: locale.locationCode
  });

  const fallback = await openAiKeywordResearch(input);

  const mergedVariants = uniq([
    fallback.primary,
    ...autocomplete,
    ...fallback.variants,
    ...fallback.longTail
  ]);

  return {
    ...fallback,
    primary: fallback.primary,
    variants: clampList(mergedVariants, 16),
    source: "dataforseo"
  };
}

async function dataForSeoAutocomplete(
  auth: { login: string; password: string },
  input: { query: string; languageCode: string; locationCode: number }
) {
  const encoded = Buffer.from(`${auth.login}:${auth.password}`).toString(
    "base64"
  );

  const response = await fetch(
    "https://api.dataforseo.com/v3/serp/google/autocomplete/live/advanced",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        {
          keyword: input.query,
          language_code: input.languageCode,
          location_code: input.locationCode,
          client: "gws-wiz-serp"
        }
      ]),
      signal: AbortSignal.timeout(15000)
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`DataForSEO autocomplete failed (${response.status}): ${text}`);
  }

  const json = JSON.parse(text) as Record<string, unknown>;
  const topStatus = Number(json.status_code ?? 0);
  if (topStatus !== 20000) {
    throw new Error(
      `DataForSEO autocomplete failed (${topStatus}): ${String(json.status_message ?? text)}`
    );
  }

  const tasks = Array.isArray(json.tasks) ? (json.tasks as unknown[]) : [];
  const firstTask = tasks[0] as Record<string, unknown> | undefined;
  const taskStatus = Number(firstTask?.status_code ?? 0);
  if (taskStatus !== 20000) {
    throw new Error(
      `DataForSEO autocomplete task failed (${taskStatus}): ${String(firstTask?.status_message ?? "unknown")}`
    );
  }

  const result = Array.isArray(firstTask?.result) ? firstTask?.result : [];
  const firstResult = (result?.[0] ?? {}) as Record<string, unknown>;
  const items = Array.isArray(firstResult.items) ? firstResult.items : [];

  const suggestions = items
    .map((item) => {
      const row = item as Record<string, unknown>;
      return row.suggestion ?? row.keyword;
    })
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return clampList(suggestions, 14);
}

