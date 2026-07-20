export const maxDuration = 300;

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { runTrendsIngestion } from "@/lib/trends-ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDailyTrendsCap() {
  const configured = Number(process.env.TRENDS_MAX_NEW_ARTICLES ?? 2);

  if (!Number.isFinite(configured) || configured <= 0) {
    return 2;
  }

  // Hard cap so cron never floods /others.
  return Math.min(Math.floor(configured), 2);
}

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
    const maxNewArticles = getDailyTrendsCap();
    const result = await runTrendsIngestion({
      maxNewArticles,
      maxTrends: Number(process.env.TRENDS_SCAN ?? 40),
      geo: process.env.GOOGLE_TRENDS_GEO ?? "US"
    });

    if (result.inserted > 0) {
      revalidateTag("articles", "max");
      revalidatePath("/others");
      revalidatePath("/");
    }

    return NextResponse.json(
      {
        ...result,
        schedule: "daily_vercel_hobby",
        note: "Hobby plan allows one Vercel cron/day. For every-2-hours, ping this endpoint from an external cron.",
        targetCategory: "others",
        perRunCap: maxNewArticles
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown trends ingestion error"
      },
      { status: 500 }
    );
  }
}
