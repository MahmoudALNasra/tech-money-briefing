import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  detectCorporateTakeaways,
  detectLowBurstiness,
  detectOwnerVoiceTemplateSignals
} from "../lib/article-attribution.ts";

const slugs = [
  ...readFileSync("scripts/manual-batch-1-rewrites.mjs", "utf8").matchAll(
    /slug: "([^"]+)"/g
  )
].map((match) => match[1]);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const { data } = await supabase
  .from("articles")
  .select("slug,category,content,key_takeaways")
  .in("slug", slugs);

let fail = 0;

for (const article of data ?? []) {
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

console.log(JSON.stringify({ pass: (data?.length ?? 0) - fail, fail }));
