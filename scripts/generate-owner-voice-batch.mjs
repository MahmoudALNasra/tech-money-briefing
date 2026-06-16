import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { OWNER_VOICE_SKIP_SLUGS } from "../lib/article-attribution.ts";

const batchNum = Number(process.argv.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? 8);
const size = Number(process.argv.find((a) => a.startsWith("--size="))?.split("=")[1] ?? 20);
const onlyOthers = process.argv.includes("--others-only");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

let query = supabase
  .from("articles")
  .select("slug,category,title")
  .eq("status", "published")
  .not("source_name", "ilike", "%Referral%")
  .order("published_at", { ascending: false });

if (onlyOthers) {
  query = query.eq("category", "others");
} else {
  query = query.neq("category", "others");
}

const { data, error } = await query;
if (error) throw error;

const queue = (data ?? []).filter((a) => !OWNER_VOICE_SKIP_SLUGS.includes(a.slug)).slice(0, size);
if (!queue.length) {
  console.log("no articles left");
  process.exit(0);
}

function cleanTitle(title) {
  return title.replace(/[🚀✨]/g, "").trim();
}

function safeTopic(title) {
  return cleanTitle(title)
    .replace(
      /\b(leverag(?:e|ing)|unlock(?:ing)?|harness(?:ing)?|navigating the|game[- ]?changer|transform(?:ing)?|strategic|optimiz(?:e|ing)|checklist for|practical guide|essential steps)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function makeArticle({ slug, category, title }) {
  const t = safeTopic(title) || "this trend";
  const short = t.length > 72 ? t.slice(0, 69) + "..." : t;

  const opener =
    category === "startups" || category === "fintech"
      ? `I would not reshape my startup plan because "${short}" trended this week.`
      : category === "creator-business" || category === "ecommerce"
        ? `I would not change how I run the business because "${short}" sounds clever in a headline.`
        : `I would not treat "${short}" like a strategy doc I must copy.`;

  const newTitle =
    category === "seo"
      ? `${short} — I would not chase the tactic before the page earns trust`
      : category === "ai-tools"
        ? `${short} — I would not buy the hype without a weekly workflow test`
        : `${short} — I would not let the headline pick my roadmap`;

  return {
    slug,
    title: newTitle,
    meta_description: `A skeptical owner take on ${short.toLowerCase()} for people who need results, not trend slides.`,
    key_takeaways: [
      `I would not bet my ${category === "startups" ? "runway" : "revenue"} on this topic until you can name the buyer and the bill it moves.`,
      `You should test one real workflow for two weeks before you rebuild tools or content around ${short.toLowerCase()}.`,
      `If you cannot explain the decision to a customer without jargon, I would not publish or ship it yet.`
    ],
    content: `${opener} News, launches, and SEO chatter are loud. Customers pay for boring outcomes: fewer mistakes, faster answers, clearer prices, and work they do not have to redo tomorrow.

## What I would verify first

Name the job someone is trying to finish when this topic matters. If the job is vague, the tactic is probably vague too.

Check what you already have: pages, offers, support tickets, sales notes. Fix leaks there before you add a new tool or trend.

## What I would not do

Copy a competitor's landing page tone.

Buy enterprise software for a ten-person problem.

Publish four near-duplicate posts because a keyword tool exported a cluster.

## A simple survival test

Can you explain the change to a tired buyer in two sentences?

Would you stake a refund on it?

Will your team still use it in thirty days without nagging?

If any answer is no, the topic can wait.

## Where this usually pays off

It pays off when you tie it to money pages, repeat customer questions, or a workflow that eats hours every week.

It fails when you treat it like content filler or founder cosplay.

The best use of ideas like this is not sounding current. The best use is making one offer clearer, one page more trustworthy, or one task shorter — then measuring whether anyone cared.`
  };
}

const articles = queue.map(makeArticle);
const file = `scripts/manual-batch-${batchNum}-rewrites.mjs`;
const lines = [`export const articles = [`];
for (const a of articles) {
  lines.push(`  {`);
  lines.push(`    slug: ${JSON.stringify(a.slug)},`);
  lines.push(`    title: ${JSON.stringify(a.title)},`);
  lines.push(`    meta_description: ${JSON.stringify(a.meta_description)},`);
  lines.push(`    key_takeaways: ${JSON.stringify(a.key_takeaways)},`);
  lines.push(`    content: \`${a.content}\``);
  lines.push(`  },`);
}
lines.push(`];`);
lines.push("");

writeFileSync(file, lines.join("\n"));
console.log("wrote", file, "count", articles.length);
console.log(JSON.stringify(queue.map((q) => q.slug)));
