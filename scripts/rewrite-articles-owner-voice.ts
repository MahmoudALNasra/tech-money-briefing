import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { loadLocalEnv } from "../lib/load-env";
import {
  runOwnerVoiceRewrite,
  type OwnerVoiceRewriteOptions
} from "../lib/owner-voice/rewrite-articles";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length).trim() || undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function readRewriteLog(logPath: string) {
  const buffer = readFileSync(logPath);
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le");
  }

  return buffer.toString("utf8");
}

function slugsFromRewriteLog(logPath: string) {
  if (!existsSync(logPath)) {
    return [] as string[];
  }

  const text = readRewriteLog(logPath);
  const matches = [
    ...text.matchAll(
      /\[owner-voice\] updated https?:\/\/[^/\s]+\/[^/\s]+\/([^\s]+)/g
    )
  ];

  return [...new Set(matches.map((match) => match[1].trim()))];
}

function completedSlugsForResume() {
  const logs = [
    join(process.cwd(), "owner-voice-aeo-rewrite.log"),
    join(process.cwd(), "owner-voice-aeo-rewrite.resume.log"),
    join(process.cwd(), "owner-voice-aeo-batch.log")
  ];

  return [...new Set(logs.flatMap((logPath) => slugsFromRewriteLog(logPath)))];
}

function parseArgvOptions(): OwnerVoiceRewriteOptions {
  const fetchAll = hasFlag("all");
  const resume = hasFlag("resume");

  return {
    all: fetchAll,
    limit: fetchAll ? undefined : getNumberArg("limit", 5),
    category: getStringArg("category"),
    slug: getStringArg("slug"),
    since: getStringArg("since"),
    dryRun: hasFlag("dry-run"),
    draftOnFail: hasFlag("draft-on-fail"),
    onlyOthers: hasFlag("others-only"),
    bulkTouchedOnly: hasFlag("bulk-touched-only"),
    includeDrafts: hasFlag("include-drafts") || Boolean(getStringArg("since")),
    includeSkipped: hasFlag("include-skipped"),
    skipSlugs: resume ? completedSlugsForResume() : undefined,
    delayMs: getNumberArg("delay-ms", 0)
  };
}

async function runCli() {
  const result = await runOwnerVoiceRewrite(parseArgvOptions());
  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

void runCli().catch((error) => {
  console.error("[owner-voice] Rewrite failed", error);
  process.exitCode = 1;
});
