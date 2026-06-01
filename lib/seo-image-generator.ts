import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

import type { ComparisonPage } from "@/lib/comparisons";
import { getSupabaseClient } from "@/lib/supabase";

const OUTPUT_DIR = resolve(process.cwd(), "public/generated");

function slugifyFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (words.length > 0 && lines.length === maxLines) {
    const last = lines[maxLines - 1];

    if (last.length > maxCharsPerLine - 3) {
      lines[maxLines - 1] = `${last.slice(0, maxCharsPerLine - 3)}...`;
    }
  }

  return lines;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSeoSvg(options: {
  eyebrow: string;
  headline: string;
  subline?: string;
  accent?: "emerald" | "indigo" | "amber" | "sky";
}) {
  const gradients = {
    emerald: ["#047857", "#10b981", "#6ee7b7"],
    indigo: ["#312e81", "#4f46e5", "#38bdf8"],
    amber: ["#b45309", "#f59e0b", "#fde68a"],
    sky: ["#0c4a6e", "#0284c7", "#7dd3fc"]
  };
  const [c1, c2, c3] = gradients[options.accent ?? "emerald"];
  const lines = wrapLines(options.headline, 22, 3);
  const subline = options.subline ? wrapLines(options.subline, 28, 2) : [];
  const lineStartY = subline.length > 0 ? 250 : 280;
  const headlineSvg = lines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : 54}" font-size="44" font-weight="800">${escapeXml(line)}</tspan>`
    )
    .join("");
  const sublineSvg = subline
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : 34}" font-size="24" font-weight="600" fill="#e2e8f0">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(options.headline)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="55%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="0" y="0" width="1200" height="630" fill="rgba(15,23,42,0.18)" />
  <circle cx="1040" cy="120" r="120" fill="rgba(255,255,255,0.08)" />
  <circle cx="180" cy="520" r="160" fill="rgba(255,255,255,0.06)" />
  <text x="72" y="118" fill="#ecfdf5" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="3">${escapeXml(options.eyebrow.toUpperCase())}</text>
  <text x="72" y="${lineStartY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${headlineSvg}</text>
  ${subline.length > 0 ? `<text x="72" y="${lineStartY + lines.length * 54 + 28}" fill="#e2e8f0" font-family="Arial, Helvetica, sans-serif">${sublineSvg}</text>` : ""}
  <text x="72" y="580" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">Tech Revenue Brief</text>
</svg>`;
}

export function writeSeoSvgFile(filename: string, svg: string) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = resolve(OUTPUT_DIR, filename);
  writeFileSync(filePath, svg, "utf8");

  return `/generated/${filename}`;
}

export function buildArticleSeoImage(input: {
  title: string;
  category: string;
}) {
  const filename = `article-${slugifyFilename(input.title)}.svg`;
  const svg = buildSeoSvg({
    eyebrow: input.category.replace(/-/g, " "),
    headline: input.title,
    subline: "Practical guide for publishers and operators",
    accent: "emerald"
  });

  return writeSeoSvgFile(filename, svg);
}

export function buildComparisonSeoImage(comparison: ComparisonPage) {
  const filename = `compare-${comparison.slug}.svg`;
  const svg = buildSeoSvg({
    eyebrow: "Software comparison",
    headline: comparison.title,
    subline: comparison.description,
    accent: "indigo"
  });

  return writeSeoSvgFile(filename, svg);
}

export type GenerateSeoImagesOptions = {
  limit?: number;
  slug?: string;
  category?: string;
  includeComparisons?: boolean;
  force?: boolean;
};

export type GenerateSeoImagesResult = {
  articlesChecked: number;
  articlesUpdated: number;
  comparisonsGenerated: number;
  skipped: number;
  errors: string[];
};

function shouldReplaceImage(imageUrl: string | null, force: boolean) {
  if (force || !imageUrl) {
    return true;
  }

  return (
    imageUrl.includes("/generated/") ||
    imageUrl.includes("og-default") ||
    imageUrl.includes("ytimg.com")
  );
}

export async function generateSeoImages(
  options: GenerateSeoImagesOptions = {}
): Promise<GenerateSeoImagesResult> {
  const supabase = getSupabaseClient();
  const limit = options.limit ?? 25;
  const result: GenerateSeoImagesResult = {
    articlesChecked: 0,
    articlesUpdated: 0,
    comparisonsGenerated: 0,
    skipped: 0,
    errors: []
  };

  let query = supabase
    .from("articles")
    .select("id,title,slug,category,image_url,status")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  if (options.category) {
    query = query.eq("category", options.category);
  }

  if (limit > 0) {
    const { data: articles, error } = await query;

    if (error) {
      throw new Error(`Failed to load articles: ${error.message}`);
    }

    for (const article of articles ?? []) {
    result.articlesChecked += 1;

    try {
      if (!shouldReplaceImage(article.image_url, Boolean(options.force))) {
        result.skipped += 1;
        continue;
      }

      const imagePath = buildArticleSeoImage({
        title: article.title,
        category: article.category
      });

      const { error: updateError } = await supabase
        .from("articles")
        .update({ image_url: imagePath })
        .eq("id", article.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      result.articlesUpdated += 1;
      console.log(`[seo:images] article ${article.slug} -> ${imagePath}`);
    } catch (err) {
      result.errors.push(
        `${article.slug}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    }
  }

  if (options.includeComparisons !== false) {
    const { COMPARISONS } = await import("@/lib/comparisons");

    for (const comparison of COMPARISONS) {
      try {
        buildComparisonSeoImage(comparison);
        result.comparisonsGenerated += 1;
      } catch (err) {
        result.errors.push(
          `compare:${comparison.slug}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  return result;
}
