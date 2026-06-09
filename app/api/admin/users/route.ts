import { NextResponse } from "next/server";

import { getAdminFromRequest, requireAdminConfigured } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/admin-credits";

export async function GET(request: Request) {
  try {
    requireAdminConfigured();
    const admin = await getAdminFromRequest(request);

    if (!admin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = Number(searchParams.get("limit") ?? "100");

    const users = await listAdminUsers({ query, limit });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
