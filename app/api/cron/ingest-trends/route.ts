export const maxDuration = 60;

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { runTrendsIngestion } from "@/lib/trends-ingestion";

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

  try {
    const result = await runTrendsIngestion({
      maxNewArticles: 10,
      maxTrends: 40,
      geo: process.env.GOOGLE_TRENDS_GEO ?? "US"
    });

    if (result.inserted > 0) {
      revalidateTag("articles", "max");
      revalidatePath("/others");
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
        error: error instanceof Error ? error.message : "Unknown trends ingestion error"
      },
      { status: 500 }
    );
  }
}
