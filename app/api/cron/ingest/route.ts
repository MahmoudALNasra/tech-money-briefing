export const maxDuration = 60;

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { runIngestion } from "@/lib/ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.DISABLE_AUTO_ARTICLE_PUBLISH === "true") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "auto_article_publish_disabled"
    });
  }

  try {
    const result = await runIngestion({
      maxNewArticles: 3,
      maxItemsPerSource: 15
    });

    if (result.results.some((source) => source.inserted > 0)) {
      revalidateTag("articles", "max");
      revalidatePath("/");
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown ingestion error"
      },
      { status: 500 }
    );
  }
}
