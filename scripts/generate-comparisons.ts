import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length).trim() || undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function run() {
  const { generateComparisons } = await import("../lib/comparison-generator");
  const limit = getNumberArg("limit", 3);
  const slug = getStringArg("slug");
  const dryRun = hasFlag("dry-run");

  console.log(
    `[compare:generate] limit=${limit}${slug ? ` slug=${slug}` : ""}${dryRun ? " dry-run" : ""}`
  );

  const result = await generateComparisons({ limit, slug, dryRun });
  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[compare:generate] Failed", error);
  process.exitCode = 1;
});
