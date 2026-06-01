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
  const { generateSeoImages } = await import("../lib/seo-image-generator");
  const limit = getNumberArg("limit", 25);
  const slug = getStringArg("slug");
  const category = getStringArg("category");
  const force = hasFlag("force");
  const comparisonsOnly = hasFlag("comparisons-only");

  console.log(
    `[seo:images] limit=${limit}${slug ? ` slug=${slug}` : ""}${force ? " force" : ""}`
  );

  const result = await generateSeoImages({
    limit: comparisonsOnly ? 0 : limit,
    slug,
    category,
    force,
    includeComparisons: comparisonsOnly ? true : !hasFlag("articles-only")
  });

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[seo:images] Failed", error);
  process.exitCode = 1;
});
