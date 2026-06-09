import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import { getGooglePlacesKey } from "@/lib/business-data-export-core";
import { advanceReportJob, serializeReportJobStatus } from "@/lib/business-data-report-jobs";
import { getWalletBalance } from "@/lib/business-data-tokens";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("id")?.trim();

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id." }, { status: 400 });
    }

    const apiKey = getGooglePlacesKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });
    }

    const job = await advanceReportJob(jobId, user.id, apiKey);

    if (!job) {
      return NextResponse.json({ error: "Report job not found." }, { status: 404 });
    }

    const balance = await getWalletBalance(user.id);

    return NextResponse.json(serializeReportJobStatus(job, balance));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
