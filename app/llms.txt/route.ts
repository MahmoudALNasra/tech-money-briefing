import { NextResponse } from "next/server";

import { LLMS_TXT_BODY } from "@/lib/llms-txt";

export const dynamic = "force-dynamic";

export function GET() {
  return new NextResponse(LLMS_TXT_BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
