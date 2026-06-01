import { spawn } from "child_process";

import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string, fallback: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const value = arg?.slice(prefix.length).trim();

  return value || fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

type StepResult = {
  name: string;
  ok: boolean;
  code: number | null;
};

function runNpmScript(
  scriptArgs: string[],
  label: string
): Promise<StepResult> {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const args = ["run", ...scriptArgs];

  return new Promise((resolvePromise) => {
    console.log(`\n[content:compound] >>> ${label}`);

    const child = spawn(npmCmd, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env
    });

    child.on("close", (code) => {
      resolvePromise({
        name: label,
        ok: code === 0,
        code
      });
    });

    child.on("error", (error) => {
      console.error(`[content:compound] ${label} failed to start`, error);
      resolvePromise({
        name: label,
        ok: false,
        code: 1
      });
    });
  });
}

async function runInlineStep<T>(
  label: string,
  fn: () => Promise<T>
): Promise<StepResult> {
  console.log(`\n[content:compound] >>> ${label}`);

  try {
    await fn();
    return { name: label, ok: true, code: 0 };
  } catch (error) {
    console.error(`[content:compound] ${label} failed`, error);
    return { name: label, ok: false, code: 1 };
  }
}

async function main() {
  const geo = getStringArg("geo", process.env.GOOGLE_TRENDS_GEO ?? "US");
  const trendsMaxNew = getNumberArg("trends-max-new", 5);
  const editorialLimit = getNumberArg("editorial-limit", 4);
  const compareLimit = getNumberArg("compare-limit", 2);
  const seoImageLimit = getNumberArg("seo-image-limit", 25);
  const gscImproveLimit = getNumberArg("gsc-improve-limit", 3);
  const fixImagesLimit = getNumberArg("fix-images-limit", 250);
  const skipTrends = hasFlag("skip-trends");
  const skipIngest = hasFlag("skip-ingest");
  const skipEditorial = hasFlag("skip-editorial");
  const skipCompare = hasFlag("skip-compare");
  const skipSeoImages = hasFlag("skip-seo-images");
  const skipGsc = hasFlag("skip-gsc");
  const dryRun = hasFlag("dry-run");

  const steps: Promise<StepResult>[] = [];

  if (!skipTrends) {
    steps.push(
      runNpmScript(
        [
          "ingest:trends",
          "--",
          `--max-new=${trendsMaxNew}`,
          `--geo=${geo}`
        ],
        "Trends ingestion"
      )
    );
  }

  if (!skipIngest) {
    steps.push(runNpmScript(["ingest"], "RSS ingestion"));
    steps.push(
      runNpmScript(["ingest:trends:backfill-images"], "Trends image backfill")
    );
  }

  if (!skipEditorial) {
    steps.push(
      runInlineStep("Editorial articles", async () => {
        const { runEditorialIngestion } = await import("../lib/editorial-ingestion");
        const result = await runEditorialIngestion({
          maxNewArticles: editorialLimit
        });
        console.log(JSON.stringify(result, null, 2));
      })
    );
  }

  if (!skipCompare) {
    steps.push(
      runInlineStep("Comparison pages", async () => {
        const { generateComparisons } = await import("../lib/comparison-generator");
        const result = await generateComparisons({
          limit: compareLimit,
          dryRun
        });
        console.log(JSON.stringify(result, null, 2));
      })
    );
  }

  if (!skipSeoImages) {
    steps.push(
      runInlineStep("SEO images", async () => {
        const { generateSeoImages } = await import("../lib/seo-image-generator");
        const result = await generateSeoImages({ limit: seoImageLimit });
        console.log(JSON.stringify(result, null, 2));
      })
    );
  }

  steps.push(
    runNpmScript(
      ["articles:fix-broken-images", "--", `--limit=${fixImagesLimit}`],
      "Fix broken article images"
    )
  );

  steps.push(
    runNpmScript(["articles:backfill-hero-images"], "Backfill hero images")
  );

  if (!skipGsc) {
    steps.push(runNpmScript(["seo:gsc-improve:dry"], "GSC improve dry-run"));
    steps.push(
      runNpmScript(
        ["seo:gsc-improve", "--", `--limit=${gscImproveLimit}`],
        "GSC improve"
      )
    );
    steps.push(runNpmScript(["seo:gsc-create:dry"], "GSC create dry-run"));
  }

  const results: StepResult[] = [];

  for (const step of steps) {
    results.push(await step);
  }

  console.log("\n[content:compound] Summary");
  console.log(JSON.stringify(results, null, 2));

  const failed = results.filter((step) => !step.ok);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main();
