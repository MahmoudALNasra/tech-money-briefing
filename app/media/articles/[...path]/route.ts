import { NextResponse } from "next/server";

import { getSupabaseClient } from "@/lib/supabase";

const ARTICLE_MEDIA_BUCKET = "article-images";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const storagePath = path.join("/");

  if (!storagePath || storagePath.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(ARTICLE_MEDIA_BUCKET)
    .download(storagePath);

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "content-type": data.type || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}
