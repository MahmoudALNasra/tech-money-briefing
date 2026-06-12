import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";

import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

const ARTICLE_MEDIA_BUCKET = "article-images";
const ARTICLE_MEDIA_ROOT = join(process.cwd(), "public", "media", "articles");

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function contentTypeForPath(path: string) {
  if (path.endsWith(".webp")) {
    return "image/webp";
  }

  if (path.endsWith(".png")) {
    return "image/png";
  }

  if (path.endsWith(".gif")) {
    return "image/gif";
  }

  if (path.endsWith(".svg")) {
    return "image/svg+xml";
  }

  return "image/jpeg";
}

async function run() {
  const supabase = getSupabaseClient();
  const { error: createBucketError } = await supabase.storage.createBucket(
    ARTICLE_MEDIA_BUCKET,
    {
      public: false,
      fileSizeLimit: "16777216"
    }
  );

  if (
    createBucketError &&
    !createBucketError.message.toLowerCase().includes("already exists")
  ) {
    throw createBucketError;
  }

  const files = listFiles(ARTICLE_MEDIA_ROOT);
  let uploaded = 0;

  for (const file of files) {
    const storagePath = relative(ARTICLE_MEDIA_ROOT, file).split(sep).join("/");
    const { error } = await supabase.storage
      .from(ARTICLE_MEDIA_BUCKET)
      .upload(storagePath, readFileSync(file), {
        contentType: contentTypeForPath(file),
        upsert: true
      });

    if (error) {
      throw new Error(`${storagePath}: ${error.message}`);
    }

    uploaded += 1;
  }

  console.log(JSON.stringify({ checked: files.length, uploaded }, null, 2));
}

run().catch((error) => {
  console.error("[upload-article-media] Failed", error);
  process.exitCode = 1;
});
