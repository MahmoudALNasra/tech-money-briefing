import { readFileSync } from "fs";
import { join } from "path";

import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

const BUCKET = "article-images";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function main() {
  const supabase = getSupabaseClient();
  const root = join(process.cwd(), "public", "media", "articles", "2026", "06");

  const files = [
    {
      localPath: join(root, "case-study-gsc-web-search-thumb-fit.png"),
      storagePath: "2026/06/case-study-gsc-web-search-thumb-fit.png",
      contentType: "image/png"
    },
    {
      localPath: join(root, "case-study-gsc-web-search-3m.png"),
      storagePath: "2026/06/case-study-gsc-web-search-3m.png",
      contentType: "image/png"
    },
    {
      localPath: join(root, "case-study-gsc-image-search-3m.png"),
      storagePath: "2026/06/case-study-gsc-image-search-3m.png",
      contentType: "image/png"
    }
  ];

  const uploaded: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  for (const file of files) {
    try {
      const buffer = readFileSync(file.localPath);
      const { error } = await withTimeout(
        supabase.storage.from(BUCKET).upload(file.storagePath, buffer, {
          contentType: file.contentType,
          upsert: true
        }),
        20_000,
        `upload ${file.storagePath}`
      );

      if (error) {
        failed.push({ path: file.storagePath, error: error.message });
        continue;
      }

      uploaded.push(file.storagePath);
    } catch (error) {
      failed.push({
        path: file.storagePath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: failed.length === 0,
        uploaded,
        failed
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[upload-gsc-case-study-media] Failed", error);
  process.exitCode = 1;
});
