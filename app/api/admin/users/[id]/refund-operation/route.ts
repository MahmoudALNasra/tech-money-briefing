import { NextResponse } from "next/server";

import { getAdminFromRequest, requireAdminConfigured } from "@/lib/admin-auth";
import { refundReportOperation } from "@/lib/admin-credits";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    requireAdminConfigured();
    const admin = await getAdminFromRequest(request);

    if (!admin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as { reportJobId?: unknown; reason?: unknown };
    const reportJobId = String(body.reportJobId ?? "").trim();
    const reason = String(body.reason ?? "").trim();

    if (!reportJobId) {
      return NextResponse.json({ error: "Missing report job id." }, { status: 400 });
    }

    const result = await refundReportOperation({
      adminUserId: admin.id,
      targetUserId: id,
      reportJobId,
      reason: reason || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
