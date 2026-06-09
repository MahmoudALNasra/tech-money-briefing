import { NextResponse } from "next/server";

import { getAdminFromRequest, requireAdminConfigured } from "@/lib/admin-auth";
import { getAdminUserDetail } from "@/lib/admin-credits";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    requireAdminConfigured();
    const admin = await getAdminFromRequest(request);

    if (!admin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const detail = await getAdminUserDetail(id);

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
