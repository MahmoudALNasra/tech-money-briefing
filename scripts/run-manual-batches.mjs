#!/usr/bin/env node
/**
 * Process manual batches in sequence. Stops on first validation failure.
 * Usage: node scripts/run-manual-batches.mjs 7 8 9
 */
import { spawnSync } from "child_process";

const batches = process.argv.slice(2).map(Number).filter(Boolean);
if (!batches.length) {
  console.error("Usage: node scripts/run-manual-batches.mjs <batchNumber> [...]");
  process.exit(1);
}

for (const n of batches) {
  const file = `scripts/manual-batch-${n}-rewrites.mjs`;
  console.log(`\n=== batch ${n} ===`);
  const result = spawnSync(
    "node",
    [
      "--env-file=.env.local",
      "./node_modules/tsx/dist/cli.mjs",
      "scripts/process-manual-batch.mjs",
      file
    ],
    { stdio: "inherit", shell: true }
  );
  if (result.status !== 0) {
    console.error(`batch ${n} failed`);
    process.exit(result.status ?? 1);
  }
}
