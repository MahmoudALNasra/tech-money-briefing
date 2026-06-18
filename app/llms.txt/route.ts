import { NextResponse } from "next/server";

import { isAdsenseReviewMode } from "@/lib/adsense-readiness";
import { LLMS_TXT_BODY } from "@/lib/llms-txt";

export const dynamic = "force-dynamic";

export function GET() {
  if (isAdsenseReviewMode()) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  return new NextResponse(LLMS_TXT_BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
