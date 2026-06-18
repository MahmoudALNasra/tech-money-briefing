import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { decodeBrandedResultImageVariant } from "@/lib/branded-result-image/generate";
import type {
  BrandedResultImageVariant,
  BrandedResultImageVariants
} from "@/lib/branded-result-image/types";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const admin = await getAdminFromRequest(request);
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const cronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!admin && !cronAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const variantParam = new URL(request.url).searchParams.get("variant");
  const variant: BrandedResultImageVariant =
    variantParam === "landscape" ? "landscape" : "square";

  const { data, error } = await supabase
    .from("social_post_drafts")
    .select("branded_image_variants")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.branded_image_variants) {
    return NextResponse.json({ error: "Branded image not found for this draft." }, { status: 404 });
  }

  const variants = data.branded_image_variants as BrandedResultImageVariants;
  const image = decodeBrandedResultImageVariant(variants, variant);

  return new NextResponse(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=86400"
    }
  });
}
