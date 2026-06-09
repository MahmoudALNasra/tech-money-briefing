import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import {
  buildReportFilename,
  getReportJob,
  serializeReportJobStatus
} from "@/lib/business-data-report-jobs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await context.params;
    const job = await getReportJob(id, user.id);

    if (!job || !job.csv) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeReportJobStatus(job),
      filename: buildReportFilename(job)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
