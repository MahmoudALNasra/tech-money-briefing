import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string, fallback: string) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);
  const value = arg?.slice(prefix.length).trim();

  return value || fallback;
}

async function executeTrendsIngestion() {
  const { runTrendsIngestion } = await import("../lib/trends-ingestion");
  const maxNewArticles = getNumberArg("max-new", 10);
  const maxTrends = getNumberArg("scan", 40);
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

    if (result.inserted > 0) {
      try {
        const { revalidateSiteCache } = await import("../lib/revalidate-site");
        await revalidateSiteCache({
          paths: ["/", "/others"],
          tags: ["articles"]
        });
      } catch (revalidateError) {
        console.warn(
          "[trends] Ingest succeeded but cache revalidate failed. Deploy latest code, then run revalidate or wait up to 5 minutes.",
          revalidateError
        );
      }
    }
  } catch (error) {
    console.error("[trends] Failed", error);
    process.exitCode = 1;
  }
}

void executeTrendsIngestion();
