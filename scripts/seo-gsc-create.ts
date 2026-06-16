import { spawn } from "child_process";

import { loadLocalEnv } from "../lib/load-env";
import {
  attachSuggestedTopics,
  fetchGscOpportunities
} from "../lib/gsc-seo";
import { runEditorialIngestion } from "../lib/editorial-ingestion";
import { revalidateSiteCache } from "../lib/revalidate-site";

loadLocalEnv();

function runNpmScript(scriptArgs: string[], label: string) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const args = ["run", ...scriptArgs];

  return new Promise<void>((resolvePromise, reject) => {
    console.log(`\n[gsc-create] >>> ${label}`);

    const child = spawn(npmCmd, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`${label} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function run() {
  const startedAt = new Date(Date.now() - 5000).toISOString();
  const dryRun = process.argv.includes("--dry-run");
  const skipOwnerVoice = process.argv.includes("--skip-owner-voice");
  const limit = getNumberArg("limit", 3);
  const days = getNumberArg("days", Number(process.env.GSC_LOOKBACK_DAYS ?? 28));

  console.log(`[gsc-create] Scanning GSC opportunities (last ${days} days)...`);

  let opportunities = (await fetchGscOpportunities({ days }))
    .filter((op) => op.type === "create_article")
    .slice(0, limit);

  if (opportunities.length === 0) {
    console.log(JSON.stringify({ inserted: 0, message: "No create_article opportunities found" }, null, 2));
    return;
  }

  opportunities = await attachSuggestedTopics(opportunities);
  const topics = opportunities
    .map((op) => op.suggestedTopic)
    .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic));

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          queued: topics.length,
          topics: topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            category: topic.category,
            angle: topic.angle
          }))
        },
        null,
        2
      )
    );
    return;
  }

  const result = await runEditorialIngestion({
    maxNewArticles: topics.length,
    topics
  });

  if (result.inserted > 0) {
    if (!skipOwnerVoice) {
      await runNpmScript(
        [
          "articles:rewrite-owner-voice",
          "--",
          "--all",
          "--draft-on-fail",
          `--since=${startedAt}`
        ],
        "Owner-voice rewrite"
      );
      await runNpmScript(
        [
          "articles:rewrite-owner-voice",
          "--",
          "--all",
          "--others-only",
          "--draft-on-fail",
          `--since=${startedAt}`
        ],
        "Owner-voice rewrite (others)"
      );
    }

    try {
      const categories = new Set(
        result.topics
          .filter((entry) => entry.status === "published")
          .map((entry) => {
            const topic = topics.find((t) => t.id === entry.id);
            return topic?.category;
          })
          .filter(Boolean)
      );

      await revalidateSiteCache({
        paths: ["/", ...[...categories].map((category) => `/${category}`)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[gsc-create] Revalidate failed", error);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[gsc-create] Failed", error);
  process.exitCode = 1;
});
