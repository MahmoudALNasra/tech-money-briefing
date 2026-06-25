import { NextResponse } from "next/server";

import { buildLlmsTxtBody, LLMS_TXT_FALLBACK } from "@/lib/build-llms-txt";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  let body = LLMS_TXT_FALLBACK;

  try {
    body = await buildLlmsTxtBody();
  } catch (error) {
    console.warn("[llms.txt] Failed to build dynamic body", error);
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
