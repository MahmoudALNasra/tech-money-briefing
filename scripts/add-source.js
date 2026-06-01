#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync, readFileSync } = require("fs");
const { resolve } = require("path");
const Parser = require("rss-parser");
const { createClient } = require("@supabase/supabase-js");

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), filename);

    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function normalizeCategory(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function usage() {
  console.error(
    'Usage: npm run add-source <RSS_URL> <CATEGORY> <SOURCE_NAME>\nExample: npm run add-source "https://example.com/feed.xml" seo-monetization "Example SEO Feed"'
  );
}

async function main() {
  loadLocalEnv();

  const [, , rssUrl, categoryInput, ...sourceNameParts] = process.argv;
  const sourceName = sourceNameParts.join(" ").trim();
  const category = normalizeCategory(categoryInput ?? "");

  if (!rssUrl || !category || !sourceName) {
    usage();
    process.exitCode = 1;
    return;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rssUrl);
  } catch {
    console.error(`[source] Invalid RSS URL: ${rssUrl}`);
    process.exitCode = 1;
    return;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    console.error("[source] RSS URL must use http or https.");
    process.exitCode = 1;
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[source] Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
    process.exitCode = 1;
    return;
  }

  const parser = new Parser({
    timeout: 15000,
    headers: {
      "User-Agent": "AutomatedNewsAggregator/1.0 (+https://techrevenuebrief.com; RSS validation)"
    }
  });

  console.log(`[source] Validating feed: ${rssUrl}`);

  let feed;

  try {
    feed = await parser.parseURL(rssUrl);
  } catch (error) {
    console.error(
      `[source] Could not read RSS feed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exitCode = 1;
    return;
  }

  if (!feed.items?.length) {
    console.error("[source] Feed is readable but has no items.");
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { error } = await supabase.from("sources").upsert(
    {
      name: sourceName,
      rss_url: rssUrl,
      category,
      is_active: true
    },
    {
      onConflict: "rss_url"
    }
  );

  if (error) {
    console.error(`[source] Failed to save source: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[source] Added and activated "${sourceName}" (${category}) with ${feed.items.length} readable items.`
  );
}

main().catch((error) => {
  console.error("[source] Unexpected failure:", error);
  process.exitCode = 1;
});
