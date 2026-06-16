import { readFileSync } from "fs";
import {
  detectCorporateTakeaways,
  detectLowBurstiness,
  detectOwnerVoiceTemplateSignals
} from "../lib/article-attribution.ts";

const file = process.argv[2] || "scripts/manual-batch-2-rewrites.mjs";
const slugs = [
  ...readFileSync(file, "utf8").matchAll(/slug: "([^"]+)"/g)
].map((match) => match[1]);

const articles = [
  ...readFileSync(file, "utf8").matchAll(
    /slug: "([^"]+)"[\s\S]*?key_takeaways: \[([\s\S]*?)\][\s\S]*?content: `([\s\S]*?)`/g
  )
].map((match) => ({
  slug: match[1],
  key_takeaways: [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]),
  content: match[3]
}));

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

console.log(JSON.stringify({ file, pass: articles.length - fail, fail }));
