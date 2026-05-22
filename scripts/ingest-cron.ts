import cron from "node-cron";

import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function executeIngestion() {
  const { runIngestion } = await import("../lib/ingestion");
  const maxNewArticles = getNumberArg("max-new", 5);
  const maxItemsPerSource = getNumberArg("scan", Math.max(maxNewArticles * 5, 25));
  const startedAt = new Date();
  console.log(
    `[ingest] Started at ${startedAt.toISOString()} (max-new=${maxNewArticles}, scan=${maxItemsPerSource})`
  );

  try {
    const result = await runIngestion({
      maxNewArticles,
      maxItemsPerSource
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("[ingest] Failed", error);
    process.exitCode = 1;
  }
}

if (process.argv.includes("--once")) {
  void executeIngestion();
} else {
  cron.schedule("0 */12 * * *", () => {
    void executeIngestion();
  });

  console.log("[ingest] Worker scheduled for every 12 hours.");
}
