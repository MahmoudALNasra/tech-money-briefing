import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import {
  listUserReportJobs,
  serializeReportJobSummary
} from "@/lib/business-data-report-jobs";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const jobs = await listUserReportJobs(user.id);

    return NextResponse.json({
      reports: jobs.map((job) => serializeReportJobSummary(job))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
