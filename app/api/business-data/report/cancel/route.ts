import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import {
  advanceReportJob,
  cancelReportJob,
  getReportJob,
  serializeReportJobStatus
} from "@/lib/business-data-report-jobs";
import { cleanText, getGooglePlacesKey } from "@/lib/business-data-export-core";
import { getWalletBalance } from "@/lib/business-data-tokens";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as { jobId?: string };
    const jobId = cleanText(body.jobId, 80);

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id." }, { status: 400 });
    }

    const cancelled = await cancelReportJob(jobId, user.id);

    if (!cancelled) {
      return NextResponse.json({ error: "Report job not found." }, { status: 404 });
    }

    const apiKey = getGooglePlacesKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });
    }

    const job =
      cancelled.status === "cancelled"
        ? await advanceReportJob(jobId, user.id, apiKey)
        : await getReportJob(jobId, user.id);

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
