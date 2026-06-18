import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import {
  listPendingOwnerVoiceArticles,
  runOwnerVoiceOnNewestArticles
} from "@/lib/owner-voice/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "10");
    const pending = await listPendingOwnerVoiceArticles(
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 30) : 10
    );

    return NextResponse.json({ pending, count: pending.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not list pending articles."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
      dryRun?: boolean;
    };
    const limit =
      typeof body.limit === "number" && body.limit > 0 ? Math.min(body.limit, 5) : 3;

    const result = await runOwnerVoiceOnNewestArticles({
      limit,
      dryRun: body.dryRun === true,
      delayMs: 500
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Owner voice rewrite failed."
      },
      { status: 500 }
    );
  }
}
