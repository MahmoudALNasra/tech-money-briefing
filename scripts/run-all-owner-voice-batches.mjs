import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const startBatch = Number(process.argv[2] ?? 8);

function readSkipSlugs() {
  const attr = readFileSync("lib/article-attribution.ts", "utf8");
  const start = attr.indexOf("OWNER_VOICE_SKIP_SLUGS");
  const end = attr.indexOf("];", start);
  return [...attr.slice(start, end).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

async function remainingCount() {
  const skip = new Set(readSkipSlugs());
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published")
    .neq("category", "others")
    .not("source_name", "ilike", "%Referral%");
  return (data ?? []).filter((a) => !skip.has(a.slug)).length;
}

function run(args) {
  const result = spawnSync(
    "node",
    ["--env-file=.env.local", "./node_modules/tsx/dist/cli.mjs", ...args],
    { stdio: "inherit", shell: true }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

let batch = startBatch;
while ((await remainingCount()) > 0) {
  const left = await remainingCount();
  console.log(`\n===== batch ${batch} | ${left} remaining =====`);
  run(["scripts/generate-owner-voice-batch.mjs", `--batch=${batch}`, "--size=20"]);
  run(["scripts/process-manual-batch.mjs", `scripts/manual-batch-${batch}-rewrites.mjs`]);
  batch += 1;
}

console.log("\n===== others category =====");
run(["scripts/generate-owner-voice-batch.mjs", `--batch=${batch}`, "--size=10", "--others-only"]);
run(["scripts/process-manual-batch.mjs", `scripts/manual-batch-${batch}-rewrites.mjs`]);
console.log("all batches complete");
