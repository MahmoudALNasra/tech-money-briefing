import { createHash } from "crypto";

import { getSupabaseClient } from "./supabase";

const ARTICLE_MEDIA_BUCKET = "article-images";
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

function slugifyFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extensionForContentType(contentType: string, url: string) {
  const normalized = contentType.toLowerCase();

  if (normalized.includes("image/webp")) {
    return "webp";
  }

  if (normalized.includes("image/png")) {
    return "png";
  }

  if (normalized.includes("image/gif")) {
    return "gif";
  }

  if (normalized.includes("image/svg")) {
    return "svg";
  }

  if (normalized.includes("image/jpeg") || normalized.includes("image/jpg")) {
    return "jpg";
  }

  const extensionMatch = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i);
  return extensionMatch?.[1]?.toLowerCase() ?? "jpg";
}

export function isSiteHostedArticleImage(url: string | null | undefined) {
  return Boolean(
    url &&
      (url.startsWith("/media/articles/") ||
        url.includes("/media/articles/") ||
        url.includes("/generated/article-"))
  );
}

export async function importArticleImageToSite(input: {
  imageUrl: string | null | undefined;
  slug: string;
  title?: string;
  publishedAt?: string | null;
}) {
  const imageUrl = input.imageUrl?.trim();

  if (!imageUrl || isSiteHostedArticleImage(imageUrl) || !imageUrl.startsWith("http")) {
    return imageUrl ?? null;
  }

  let response: Response;

  try {
    response = await fetch(imageUrl, {
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; TechRevenueBriefBot/1.0; +https://techrevenuebrief.com)"
      },
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("image/")) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    return null;
  }

  const date = input.publishedAt ? new Date(input.publishedAt) : new Date();
  const year = Number.isFinite(date.getTime()) ? date.getUTCFullYear() : new Date().getUTCFullYear();
  const month = String(
    Number.isFinite(date.getTime()) ? date.getUTCMonth() + 1 : new Date().getUTCMonth() + 1
  ).padStart(2, "0");
  const hash = createHash("sha1").update(imageUrl).digest("hex").slice(0, 10);
  const baseName = slugifyFilename(input.slug || input.title || "article-image");
  const extension = extensionForContentType(contentType, imageUrl);
  const filename = `${baseName}-${hash}.${extension}`;
  const storagePath = `${year}/${month}/${filename}`;
  const supabase = getSupabaseClient();
  let { error } = await supabase.storage
    .from(ARTICLE_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true
    });

  if (error && error.message.toLowerCase().includes("bucket not found")) {
    const { error: createBucketError } = await supabase.storage.createBucket(
      ARTICLE_MEDIA_BUCKET,
      {
        public: false,
        fileSizeLimit: `${MAX_IMAGE_BYTES}`
      }
    );

    if (!createBucketError) {
      ({ error } = await supabase.storage
        .from(ARTICLE_MEDIA_BUCKET)
        .upload(storagePath, buffer, {
          contentType,
          upsert: true
        }));
    }
  }

  if (error) {
    return null;
  }

  return `/media/articles/${storagePath}`;
}
