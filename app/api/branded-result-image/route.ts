import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import {
  encodeBrandedResultImageVariants,
  generateBrandedResultImage
} from "@/lib/branded-result-image/generate";
import { brandedImageInputFromSocialPayload } from "@/lib/branded-result-image/normalize";
import { pickBrandedImageTheme } from "@/lib/branded-result-image/pick-theme";
import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCron(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  return Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  const cronAuthorized = isAuthorizedCron(request);

  if (!admin && !cronAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as BrandedResultImageInput | Record<string, unknown>;
    const input: BrandedResultImageInput =
      "hook_question" in body && "punch_line" in body
        ? {
            ...(body as BrandedResultImageInput),
            themeId:
              (body as BrandedResultImageInput).themeId ??
              pickBrandedImageTheme(
                `${(body as BrandedResultImageInput).hook_question}|${(body as BrandedResultImageInput).badge_label}`
              )
          }
        : brandedImageInputFromSocialPayload(body as Record<string, unknown>);

    const buffers = await generateBrandedResultImage(input);
    const searchParams = new URL(request.url).searchParams;
    const variant = searchParams.get("variant") === "landscape" ? "landscape" : "square";
    const encoded = encodeBrandedResultImageVariants(buffers);

    if (searchParams.get("format") === "json") {
      return NextResponse.json({ variants: encoded });
    }

    return new NextResponse(variant === "landscape" ? buffers.landscape : buffers.square, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=86400"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not generate branded result image."
      },
      { status: 500 }
    );
  }
}
