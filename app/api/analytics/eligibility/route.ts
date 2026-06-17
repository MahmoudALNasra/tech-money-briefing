import { NextResponse } from "next/server";

import { getClientIp, isExcludedAnalyticsIp } from "@/lib/visitor-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIp(request);

  return NextResponse.json({
    excluded: isExcludedAnalyticsIp(ip)
  });
}
