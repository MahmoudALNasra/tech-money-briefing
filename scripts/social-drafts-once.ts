import { loadLocalEnv } from "../lib/load-env";
import { runDailySocialDrafts } from "../lib/social-drafts/run";
import type { SocialSourceType } from "../lib/social-drafts/types";
import { SOCIAL_SOURCE_TYPES } from "../lib/social-drafts/types";

loadLocalEnv();

function readForceSourceType(): SocialSourceType | undefined {
  const flag = process.argv.find((arg) => arg.startsWith("--source="));
  const value = flag?.split("=")[1]?.trim();

  if (!value) {
    return undefined;
  }

  if ((SOCIAL_SOURCE_TYPES as readonly string[]).includes(value)) {
    return value as SocialSourceType;
  }

  throw new Error(
    `Unknown --source value "${value}". Use one of: ${SOCIAL_SOURCE_TYPES.join(", ")}`
  );
}

async function main() {
  const forceSourceType = readForceSourceType();
  const result = await runDailySocialDrafts({
    runLabel: "manual",
    forceSourceType
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
