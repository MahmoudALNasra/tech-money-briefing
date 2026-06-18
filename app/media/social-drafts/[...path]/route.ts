import { NextResponse } from "next/server";

import { getSupabaseClient } from "@/lib/supabase";

const SOCIAL_DRAFT_MEDIA_BUCKET = "social-draft-images";

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
    .from(SOCIAL_DRAFT_MEDIA_BUCKET)
    .download(storagePath);

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}
