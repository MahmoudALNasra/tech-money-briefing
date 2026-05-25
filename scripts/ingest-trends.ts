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

async function executeTrendsIngestion() {
  const { runTrendsIngestion } = await import("../lib/trends-ingestion");
  const maxNewArticles = getNumberArg("max-new", 3);
  const maxTrends = getNumberArg("scan", Math.max(maxNewArticles * 4, 12));
  const geo = getStringArg("geo", process.env.GOOGLE_TRENDS_GEO ?? "US");
  const startedAt = new Date();

  console.log(
    `[trends] Started at ${startedAt.toISOString()} (geo=${geo}, max-new=${maxNewArticles}, scan=${maxTrends})`
  );

  try {
    const result = await runTrendsIngestion({
      maxNewArticles,
      maxTrends,
      geo
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("[trends] Failed", error);
    process.exitCode = 1;
  }
}

void executeTrendsIngestion();
