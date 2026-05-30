import { readFileSync } from "fs";
import { join } from "path";

import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400;

function getAdsTxtBody() {
  const publisherId =
    process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT?.replace(/^ca-pub-/, "pub-") ??
    "pub-8203750015609502";

  try {
    const filePath = join(process.cwd(), "public", "ads.txt");
    const fileContents = readFileSync(filePath, "utf8").trim();

    if (fileContents) {
      return fileContents;
    }
  } catch {
    // Fall back to env-derived publisher line below.
  }

  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
}

export function GET() {
  return new NextResponse(getAdsTxtBody(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
