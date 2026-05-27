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

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);

  return arg?.slice(prefix.length).trim() || undefined;
}

async function executeEditorialGeneration() {
  const { runEditorialIngestion } = await import("../lib/editorial-ingestion");
  const maxNewArticles = getNumberArg("limit", 1);
  const topicId = getStringArg("topic-id");
  const startedAt = new Date();

  console.log(
    `[editorial] Started at ${startedAt.toISOString()} (limit=${maxNewArticles}${topicId ? `, topic-id=${topicId}` : ""})`
  );

  try {
    const result = await runEditorialIngestion({
      maxNewArticles,
      topicId
    });
    console.log(JSON.stringify(result, null, 2));

    if (result.inserted > 0) {
      try {
        const { revalidateSiteCache } = await import("../lib/revalidate-site");
        const { EDITORIAL_TOPICS } = await import("../data/editorial-topics");
        const publishedTopicIds = new Set(
          result.topics
            .filter((entry) => entry.status === "published")
            .map((entry) => entry.id)
        );
        const paths = [
          "/",
          ...EDITORIAL_TOPICS.filter((topic) =>
            publishedTopicIds.has(topic.id)
          ).map((topic) => `/${topic.category}`)
        ];

        await revalidateSiteCache({
          paths: [...new Set(paths)],
          tags: ["articles"]
        });
      } catch (revalidateError) {
        console.warn(
          "[editorial] Publish succeeded but cache revalidate failed.",
          revalidateError
        );
      }
    }
  } catch (error) {
    console.error("[editorial] Failed", error);
    process.exitCode = 1;
  }
}

void executeEditorialGeneration();
