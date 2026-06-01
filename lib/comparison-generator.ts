import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { COMPARISON_SEEDS, type ComparisonSeed } from "@/data/comparison-seeds";
import type { ComparisonPage } from "@/lib/comparisons";
import { getOpenAIClient } from "@/lib/openai";
import { siteConfig } from "@/lib/site";

const GENERATED_PATH = resolve(process.cwd(), "data/generated-comparisons.json");

const VALID_TOOL_HREFS = [
  "/keyword-cluster-tool",
  "/serp-intent-analyzer",
  "/content-gap-finder",
  "/content-brief-generator",
  "/blog-title-generator",
  "/meta-description-generator",
  "/ai-headline-generator",
  "/robots-txt-generator",
  "/utm-builder",
  "/cpm-rpm-calculator",
  "/adsense-revenue-calculator",
  "/newsletter-revenue-calculator",
  "/newsletter-subject-line-generator",
  "/saas-pricing-calculator",
  "/startup-name-generator",
  "/tools"
];

function loadGeneratedComparisons(): ComparisonPage[] {
  try {
    const raw = readFileSync(GENERATED_PATH, "utf8");
    const parsed = JSON.parse(raw) as ComparisonPage[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGeneratedComparisons(comparisons: ComparisonPage[]) {
  writeFileSync(GENERATED_PATH, `${JSON.stringify(comparisons, null, 2)}\n`, "utf8");
}

function isComparisonPage(value: unknown): value is ComparisonPage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as ComparisonPage;

  return (
    typeof row.slug === "string" &&
    typeof row.title === "string" &&
    typeof row.description === "string" &&
    typeof row.productA === "string" &&
    typeof row.productB === "string" &&
    typeof row.summary === "string" &&
    Array.isArray(row.bestForA) &&
    Array.isArray(row.bestForB) &&
    Array.isArray(row.decisionRows) &&
    typeof row.monetizationAngle === "string" &&
    Array.isArray(row.relatedToolHrefs) &&
    Array.isArray(row.keywords)
  );
}

function normalizeToolHrefs(hrefs: string[]) {
  const normalized = hrefs
    .map((href) => (href.startsWith("/") ? href : `/${href}`))
    .filter((href) => VALID_TOOL_HREFS.includes(href));

  if (normalized.length > 0) {
    return [...new Set(normalized)].slice(0, 4);
  }

  return ["/tools", "/keyword-cluster-tool", "/blog-title-generator"];
}

async function generateComparisonFromSeed(
  seed: ComparisonSeed
): Promise<ComparisonPage> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write software comparison pages for publishers and operators. Return only valid JSON matching the schema. Do not invent pricing numbers or fake feature launches."
      },
      {
        role: "user",
        content: JSON.stringify({
          siteName: siteConfig.name,
          seed,
          schema: {
            slug: seed.slug,
            title: `${seed.productA} vs ${seed.productB}`,
            description: "120-180 char meta-style description",
            productA: seed.productA,
            productB: seed.productB,
            summary: "2-3 sentences",
            bestForA: ["3 bullets"],
            bestForB: ["3 bullets"],
            decisionRows: [
              { label: "string", left: "string", right: "string" },
              "4 rows total"
            ],
            monetizationAngle: "1-2 sentences tying choice to revenue or workflow",
            relatedToolHrefs: VALID_TOOL_HREFS,
            keywords: ["2-4 keyword phrases including vs query"]
          },
          instructions: [
            "Match the tone of practical publisher-focused comparisons.",
            "Follow Google's generative AI Search guidance: write useful, non-commodity comparison guidance with a clear operator perspective.",
            "Do not invent pricing numbers, unreleased features, fake hands-on testing, or inauthentic product mentions.",
            "Make the summary and decision rows specific enough to help a buyer choose, not just a generic list of features.",
            "Pick 2-4 relatedToolHrefs only from the provided list.",
            "Slug must exactly match the seed slug."
          ]
        })
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty comparison JSON");
  }

  const parsed = JSON.parse(content) as ComparisonPage;

  if (!isComparisonPage(parsed)) {
    throw new Error("Generated comparison failed validation");
  }

  if (parsed.slug !== seed.slug) {
    parsed.slug = seed.slug;
  }

  parsed.title = parsed.title || `${seed.productA} vs ${seed.productB}`;
  parsed.productA = seed.productA;
  parsed.productB = seed.productB;
  parsed.relatedToolHrefs = normalizeToolHrefs(parsed.relatedToolHrefs);

  return parsed;
}

export type GenerateComparisonsOptions = {
  limit?: number;
  slug?: string;
  dryRun?: boolean;
};

export type GenerateComparisonsResult = {
  queued: number;
  generated: number;
  skipped: number;
  slugs: string[];
  errors: string[];
};

export async function generateComparisons(
  options: GenerateComparisonsOptions = {}
): Promise<GenerateComparisonsResult> {
  const limit = options.limit ?? 3;
  const existing = loadGeneratedComparisons();
  const existingSlugs = new Set(existing.map((item) => item.slug));

  const { COMPARISONS } = await import("@/lib/comparisons");
  for (const comparison of COMPARISONS) {
    existingSlugs.add(comparison.slug);
  }

  let seeds = COMPARISON_SEEDS.filter((seed) => !existingSlugs.has(seed.slug));

  if (options.slug) {
    seeds = seeds.filter((seed) => seed.slug === options.slug);
  }

  seeds = seeds.slice(0, limit);

  const result: GenerateComparisonsResult = {
    queued: seeds.length,
    generated: 0,
    skipped: 0,
    slugs: [],
    errors: []
  };

  const nextGenerated = [...existing];

  for (const seed of seeds) {
    try {
      const comparison = await generateComparisonFromSeed(seed);

      if (options.dryRun) {
        result.generated += 1;
        result.slugs.push(comparison.slug);
        continue;
      }

      nextGenerated.push(comparison);
      existingSlugs.add(comparison.slug);
      result.generated += 1;
      result.slugs.push(comparison.slug);
    } catch (error) {
      result.errors.push(
        `${seed.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!options.dryRun && result.generated > 0) {
    saveGeneratedComparisons(nextGenerated);
  }

  return result;
}

export function getGeneratedComparisonsPath() {
  return GENERATED_PATH;
}
