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

  return arg?.slice(prefix.length).trim() || fallback;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const maxNew = getNumberArg("max-new", Number(process.env.OWNER_VOICE_TRENDS_MAX_NEW ?? 5));
  const maxTrends = getNumberArg("scan", 40);
  const geo = getStringArg("geo", process.env.GOOGLE_TRENDS_GEO ?? "US");

  if (dryRun) {
    const { collectTrendSeedsForIngestion } = await import("../lib/trends-ingestion");

    const seeds = await collectTrendSeedsForIngestion({ maxTrends, geo });

    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          maxNew,
          scanned: seeds.length,
          preview: seeds.slice(0, 15).map((seed) => ({
            title: seed.title,
            traffic: seed.traffic
          }))
        },
        null,
        2
      )
    );
    return;
  }

  const { runOwnerVoiceTrendsIngestion } = await import(
    "../lib/owner-voice-trends-ingestion"
  );
  const { revalidateSiteCache } = await import("../lib/revalidate-site");

  const result = await runOwnerVoiceTrendsIngestion({
    maxNewArticles: maxNew,
    maxTrends,
    geo
  });

  if (result.inserted > 0) {
    await revalidateSiteCache({
      paths: ["/", ...result.published.map((article) => `/${article.category}`)],
      tags: ["articles"]
    });
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[owner-voice-trends] Failed", error);
  process.exitCode = 1;
});
