import { NextRequest, NextResponse } from "next/server";

import {
  normalizeCampaignSlug,
  normalizeInternalDestination,
  trackCustomLinkVisit
} from "@/lib/custom-link-tracking";

type TrackingRouteProps = {
  params: Promise<{
    campaign: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: TrackingRouteProps) {
  const { campaign } = await params;
  const normalizedCampaign = normalizeCampaignSlug(campaign) || "custom-link";
  const destinationPath = normalizeInternalDestination(
    request.nextUrl.searchParams.get("to")
  );

  await trackCustomLinkVisit({
    request,
    campaign: normalizedCampaign,
    destinationPath
  });

  return NextResponse.redirect(new URL(destinationPath, request.nextUrl.origin));
}
