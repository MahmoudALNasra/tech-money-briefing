#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync, readFileSync } = require("fs");
const { resolve } = require("path");
const { createClient } = require("@supabase/supabase-js");

const categoryMappings = [
  {
    from: ["artificial-intelligence", "ai-business-tools"],
    to: "ai-tools"
  },
  {
    from: ["seo-monetization"],
    to: "seo"
  },
  {
    from: ["ecommerce-monetization"],
    to: "ecommerce"
  },
  {
    from: ["online-business", "creator-monetization"],
    to: "creator-business"
  }
];

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

async function updateTable(supabase, table, from, to) {
  const { data, error, count } = await supabase
    .from(table)
    .update({ category: to }, { count: "exact" })
    .in("category", from)
    .select("id");

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  return count ?? data?.length ?? 0;
}

async function main() {
  loadLocalEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[normalize] Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const summary = [];

  for (const mapping of categoryMappings) {
    const articlesUpdated = await updateTable(
      supabase,
      "articles",
      mapping.from,
      mapping.to
    );
    const sourcesUpdated = await updateTable(
      supabase,
      "sources",
      mapping.from,
      mapping.to
    );

    summary.push({
      from: mapping.from,
      to: mapping.to,
      articlesUpdated,
      sourcesUpdated
    });

    console.log(
      `[normalize] ${mapping.from.join(", ")} -> ${mapping.to}: articles=${articlesUpdated}, sources=${sourcesUpdated}`
    );
  }

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

main().catch((error) => {
  console.error("[normalize] Failed", error);
  process.exitCode = 1;
});
