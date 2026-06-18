import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { runDailySocialDrafts } from "@/lib/social-drafts/run";
import type { SocialSourceType } from "@/lib/social-drafts/types";
import { SOCIAL_SOURCE_TYPES } from "@/lib/social-drafts/types";
import { absoluteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function summarizeDraftForResponse(draft: Awaited<ReturnType<typeof runDailySocialDrafts>>["draft"]) {
  if (!draft.branded_image_variants) {
    return {
      ...draft,
      has_branded_images: false,
      branded_image_square_url: null,
      branded_image_landscape_url: null
    };
  }

  const squarePath = draft.branded_image_variants.square.publicPath;
  const landscapePath = draft.branded_image_variants.landscape.publicPath;

  return {
    ...draft,
    branded_image_variants: null,
    has_branded_images: true,
    branded_image_square_url: squarePath ? absoluteUrl(squarePath) : null,
    branded_image_landscape_url: landscapePath ? absoluteUrl(landscapePath) : null
  };
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let forceSourceType: SocialSourceType = "enrichment_example";

  try {
    const body = (await request.json().catch(() => ({}))) as {
      forceSourceType?: string;
      skipEmail?: boolean;
    };

    if (
      body.forceSourceType &&
      (SOCIAL_SOURCE_TYPES as readonly string[]).includes(body.forceSourceType)
    ) {
      forceSourceType = body.forceSourceType as SocialSourceType;
    }

    const result = await runDailySocialDrafts({
      runLabel: "manual",
      forceSourceType,
      skipEmail: body.skipEmail === true,
      applyOwnerVoice: true
    });

    return NextResponse.json({
      ok: true,
      draft: summarizeDraftForResponse(result.draft),
      source_type: result.source_type,
      requested_source_type: result.requested_source_type,
      fallback_from: result.fallback_from,
      email: result.email
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not generate social draft."
      },
      { status: 500 }
    );
  }
}
