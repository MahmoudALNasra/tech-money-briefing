import { loadLocalEnv } from "../lib/load-env";
import { runDailySocialDrafts } from "../lib/social-drafts/run";

loadLocalEnv();

async function main() {
  const result = await runDailySocialDrafts({ runLabel: "manual" });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
