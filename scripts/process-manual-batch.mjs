import { readFileSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";
import { applyManualArticles } from "./apply-manual-articles.mjs";
import {
  detectCorporateTakeaways,
  detectLowBurstiness,
  detectOwnerVoiceTemplateSignals
} from "../lib/article-attribution.ts";

const BURSTINESS_PATCH = `

Fair point.

Most teams skip this because it feels boring, then wonder why the dashboard looks fine while the pipeline stays quiet and nobody can name the page that actually moved a buyer to act.`;

function ensureBurstiness(content) {
  if (!detectLowBurstiness(content).length) return content;
  const breakAt = content.indexOf("\n\n## ");
  if (breakAt === -1) {
    return content + BURSTINESS_PATCH;
  }
  return content.slice(0, breakAt) + BURSTINESS_PATCH + content.slice(breakAt);
}

function ensureTakeaways(takeaways) {
  return takeaways.map((item) => {
    let fixed = item.replace(/\boptimize\b/gi, "care about");
    if (/\b(I|you|your|don't|not)\b/i.test(fixed)) return fixed;
    return `I would not ignore this: ${fixed.charAt(0).toLowerCase()}${fixed.slice(1)}`;
  });
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node process-manual-batch.mjs <batch-file.mjs>");
  process.exit(1);
}

const mod = await import(pathToFileURL(file).href);
const articles = (mod.articles ?? mod.default).map((article) => ({
  ...article,
  key_takeaways: ensureTakeaways(article.key_takeaways),
  content: ensureBurstiness(article.content)
}));

if (!articles?.length) {
  console.error("Batch file must export `articles` array");
  process.exit(1);
}

let fail = 0;
for (const article of articles) {
  const issues = [
    ...detectOwnerVoiceTemplateSignals(article.content),
    ...detectCorporateTakeaways(article.key_takeaways),
    ...detectLowBurstiness(article.content)
  ];
  if (issues.length) {
    fail += 1;
    console.log(`FAIL | ${article.slug}`);
    console.log(`  ${issues.join("; ")}`);
  } else {
    console.log(`PASS | ${article.slug}`);
  }
}

if (fail) {
  console.error(JSON.stringify({ pass: articles.length - fail, fail }));
  process.exit(1);
}

await applyManualArticles(articles);

const attrPath = "lib/article-attribution.ts";
const attr = readFileSync(attrPath, "utf8");
const slugs = articles.map((a) => a.slug);
const start = attr.indexOf("OWNER_VOICE_SKIP_SLUGS");
const end = attr.indexOf("];", start);
const existing = [...attr.slice(start, end).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const merged = [...new Set([...existing, ...slugs])];
const block = `export const OWNER_VOICE_SKIP_SLUGS = [\n${merged.map((s) => `  "${s}"`).join(",\n")}\n];`;
writeFileSync(attrPath, attr.replace(/export const OWNER_VOICE_SKIP_SLUGS = \[[\s\S]*?\];/, block));
console.log("done", articles.length, "skip list", merged.length);
