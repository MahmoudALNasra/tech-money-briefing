import {
  applyReportFilters,
  applySearchFilters,
  parseReportFilters,
  parseSearchFilters
} from "@/lib/business-data-search-filters";
import {
  nearbySearchAll,
  placeDetails,
  processPlacesBatch,
  REPORT_BATCH_SIZE,
  resolveSearchCenter,
  toCsv,
  type ExportRow,
  type GoogleNearbyPlace
} from "@/lib/business-data-export-core";
import {
  BUSINESS_DATA_REPORT_LIMITS,
  debitTokens,
  ESTIMATED_COSTS_USD,
  getBusinessDataExportTokenCost,
  getWalletBalance,
  logUsageEvent
} from "@/lib/business-data-tokens";
import { supabase } from "@/lib/supabase";

export type ReportJobStatus = "running" | "completed" | "cancelled" | "failed";

export type ReportJobQuery = {
  location: string;
  category: string;
  radiusMeters: number;
  center: {
    lat: number;
    lng: number;
    label: string;
  };
  places: GoogleNearbyPlace[];
  preChargedPlaceIds?: string[];
};

export type ReportJobRow = {
  id: string;
  user_id: string;
  status: ReportJobStatus;
  requested_count: number;
  processed_count: number;
  processed_index: number;
  charged_credits: number;
  cache_key: string;
  query: ReportJobQuery;
  results: ExportRow[];
  csv: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};

function mapJob(row: Record<string, unknown>): ReportJobRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    status: row.status as ReportJobStatus,
    requested_count: Number(row.requested_count),
    processed_count: Number(row.processed_count),
    processed_index: Number(row.processed_index),
    charged_credits: Number(row.charged_credits),
    cache_key: String(row.cache_key),
    query: (row.query ?? { places: [] }) as ReportJobQuery,
    results: (row.results ?? []) as ExportRow[],
    csv: row.csv ? String(row.csv) : null,
    error: row.error ? String(row.error) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    cancelled_at: row.cancelled_at ? String(row.cancelled_at) : null
  };
}

export function buildReportFilename(job: Pick<ReportJobRow, "query" | "requested_count" | "processed_count">) {
  const category = job.query?.category ?? "report";
  const rowCount = job.processed_count || job.requested_count;
  return `business-data-export-${category}-${job.requested_count}-${rowCount}.xlsx`;
}

export async function listUserReportJobs(userId: string, limit = 25) {
  const { data, error } = await supabase
    .from("business_data_report_jobs")
    .select(
      "id, status, requested_count, processed_count, charged_credits, query, created_at, updated_at, csv"
    )
    .eq("user_id", userId)
    .in("status", ["completed", "cancelled"])
    .not("csv", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapJob(row as Record<string, unknown>));
}

export async function getReportJob(jobId: string, userId: string) {
  const { data, error } = await supabase
    .from("business_data_report_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapJob(data as Record<string, unknown>) : null;
}

export async function createReportJob(input: {
  userId: string;
  requestedCount: number;
  cacheKey: string;
  query: ReportJobQuery;
}) {
  const { data, error } = await supabase
    .from("business_data_report_jobs")
    .insert({
      user_id: input.userId,
      status: "running",
      requested_count: input.requestedCount,
      cache_key: input.cacheKey,
      query: input.query,
      results: [],
      processed_count: 0,
      processed_index: 0,
      charged_credits: 0
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapJob(data as Record<string, unknown>);
}

export async function cancelReportJob(jobId: string, userId: string) {
  const job = await getReportJob(jobId, userId);

  if (!job) {
    return null;
  }

  if (job.status !== "running") {
    return job;
  }

  const { data, error } = await supabase
    .from("business_data_report_jobs")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapJob(data as Record<string, unknown>);
}

async function finalizeReportJob(job: ReportJobRow) {
  if (job.status === "completed" || job.status === "failed") {
    return job;
  }

  const rows = job.results;
  const preCharged = new Set(job.query.preChargedPlaceIds ?? []);
  const creditsToCharge = rows.filter((row) => !preCharged.has(row.place_id)).length;

  if (creditsToCharge === 0 && rows.length > 0) {
    const csv = toCsv(rows);
    const { data, error } = await supabase
      .from("business_data_report_jobs")
      .update({
        status: "completed",
        results: rows,
        csv,
        processed_count: rows.length,
        charged_credits: 0,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await logUsageEvent({
      userId: job.user_id,
      eventType: "full_export",
      tokensCharged: 0,
      estimatedCostUsd: 0,
      metadata: {
        job_id: job.id,
        category: job.query.category,
        location: job.query.location,
        requested_count: job.requested_count,
        processed_count: rows.length,
        pre_charged_only: true
      }
    });

    return mapJob(data as Record<string, unknown>);
  }

  if (creditsToCharge === 0) {
    const { data, error } = await supabase
      .from("business_data_report_jobs")
      .update({
        status: job.status === "cancelled" ? "cancelled" : "failed",
        error: job.error ?? "No businesses were processed.",
        processed_count: 0,
        charged_credits: 0,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapJob(data as Record<string, unknown>);
  }

  let rowsToDeliver = rows;
  let creditsToDebit = creditsToCharge;
  let csv = toCsv(rowsToDeliver);
  let debit = await debitTokens({
    userId: job.user_id,
    amount: creditsToDebit,
    reason: job.status === "cancelled" ? "report_cancelled_partial" : "full_export",
    metadata: {
      job_id: job.id,
      category: job.query.category,
      location: job.query.location,
      requested_count: job.requested_count,
      processed_count: rowsToDeliver.length,
      cancelled: job.status === "cancelled"
    }
  });

  if (!debit.ok) {
    const fallbackBalance = await getWalletBalance(job.user_id);
    const fallbackCredits = Math.min(fallbackBalance, rows.length);

    if (fallbackCredits > 0) {
      rowsToDeliver = rows.slice(0, fallbackCredits);
      creditsToDebit = rowsToDeliver.length;
      csv = toCsv(rowsToDeliver);
      debit = await debitTokens({
        userId: job.user_id,
        amount: creditsToDebit,
        reason: "full_export_available_credits",
        metadata: {
          job_id: job.id,
          category: job.query.category,
          location: job.query.location,
          requested_count: job.requested_count,
          processed_count: rowsToDeliver.length,
          generated_count: rows.length,
          fallback_charge: true
        }
      });
    }
  }

  if (!debit.ok) {
    const { data, error } = await supabase
      .from("business_data_report_jobs")
      .update({
        status: "failed",
        error:
          "No credits were available to finalize the processed businesses. Your generated rows were preserved in the job, but no report was delivered.",
        processed_count: rows.length,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapJob(data as Record<string, unknown>);
  }

  await logUsageEvent({
    userId: job.user_id,
    eventType: job.status === "cancelled" ? "report_cancelled_partial" : "full_export",
    tokensCharged: creditsToDebit,
    estimatedCostUsd:
      ESTIMATED_COSTS_USD.fullExport *
      (Math.max(rowsToDeliver.length, 1) / BUSINESS_DATA_REPORT_LIMITS.max),
    metadata: {
      job_id: job.id,
      category: job.query.category,
      location: job.query.location,
      requested_count: job.requested_count,
      row_count: rowsToDeliver.length,
      generated_count: rows.length,
      fallback_trimmed: rowsToDeliver.length < rows.length,
      cancelled: job.status === "cancelled",
      balance_after: debit.balance
    }
  });

  const finalStatus = job.status === "cancelled" ? "cancelled" : "completed";
  const { data, error } = await supabase
    .from("business_data_report_jobs")
    .update({
      status: finalStatus,
      csv,
      results: rowsToDeliver,
      processed_count: rowsToDeliver.length,
      charged_credits: creditsToDebit,
      updated_at: new Date().toISOString()
    })
    .eq("id", job.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapJob(data as Record<string, unknown>);
}

export async function advanceReportJob(jobId: string, userId: string, apiKey: string) {
  let job = await getReportJob(jobId, userId);

  if (!job) {
    return null;
  }

  if (job.status === "completed" || job.status === "failed") {
    return job;
  }

  const places = job.query.places ?? [];
  const totalPlaces = places.length;

  if (job.status === "cancelled" || job.processed_index >= totalPlaces) {
    return finalizeReportJob(job);
  }

  const { rows: batchRows, nextIndex } = await processPlacesBatch({
    places,
    startIndex: job.processed_index,
    batchSize: REPORT_BATCH_SIZE,
    category: job.query.category,
    apiKey,
    allPlacesForDensity: places
  });

  const nextResults = [...job.results, ...batchRows];
  const refreshed = await getReportJob(jobId, userId);
  const shouldStop = refreshed?.status === "cancelled";

  const { data, error } = await supabase
    .from("business_data_report_jobs")
    .update({
      results: nextResults,
      processed_index: nextIndex,
      processed_count: nextResults.length,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  job = mapJob(data as Record<string, unknown>);

  if (shouldStop || job.processed_index >= totalPlaces) {
    return finalizeReportJob(job);
  }

  return job;
}

export async function startReportJob(input: {
  userId: string;
  body: Record<string, unknown>;
  apiKey: string;
  cacheKey: string;
  location: string;
  category: string;
  radiusMeters: number;
  requestedCount: number;
}) {
  const requestedPlaceIds = Array.isArray(input.body.placeIds)
    ? input.body.placeIds
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .slice(0, 60)
    : [];
  const preChargedPlaceIds = Array.isArray(input.body.preChargedPlaceIds)
    ? input.body.preChargedPlaceIds
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    : [];
  const preChargedSet = new Set(preChargedPlaceIds);
  const seededExportRows = Array.isArray(input.body.seededExportRows)
    ? (input.body.seededExportRows as ExportRow[])
    : [];
  const useSampleSelection =
    Boolean(input.body.useSampleSelection) &&
    requestedPlaceIds.length > 0 &&
    seededExportRows.length > 0;

  const selectedSeededRows = useSampleSelection
    ? seededExportRows.filter((row) => requestedPlaceIds.includes(row.place_id))
    : [];
  const creditsRequired = useSampleSelection
    ? selectedSeededRows.filter((row) => !preChargedSet.has(row.place_id)).length
    : getBusinessDataExportTokenCost(input.requestedCount);
  const balance = await getWalletBalance(input.userId);

  if (balance < creditsRequired) {
    return {
      ok: false as const,
      error: useSampleSelection
        ? `Not enough credits. This selection needs ${creditsRequired} additional credits beyond Sample Enrich.`
        : `Not enough credits. This ${input.requestedCount}-business report needs up to ${creditsRequired} credits.`,
      balance,
      required: creditsRequired
    };
  }

  const center = await resolveSearchCenter({
    body: input.body,
    location: input.location,
    apiKey: input.apiKey
  });

  if (useSampleSelection && selectedSeededRows.length > 0) {
    const job = await createReportJob({
      userId: input.userId,
      requestedCount: selectedSeededRows.length,
      cacheKey: input.cacheKey,
      query: {
        location: input.location,
        category: input.category,
        radiusMeters: input.radiusMeters,
        center,
        places: selectedSeededRows.map((row) => ({
          place_id: row.place_id,
          name: row.name
        })),
        preChargedPlaceIds
      }
    });

    const { data, error } = await supabase
      .from("business_data_report_jobs")
      .update({
        results: selectedSeededRows,
        processed_count: selectedSeededRows.length,
        processed_index: selectedSeededRows.length,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id)
      .eq("user_id", input.userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const finalized = await finalizeReportJob(mapJob(data as Record<string, unknown>));

    return {
      ok: true as const,
      job: finalized
    };
  }

  const searchFilters = parseSearchFilters(input.body);
  const reportFilters = parseReportFilters(input.body);

  let places = await nearbySearchAll({
    apiKey: input.apiKey,
    lat: center.lat,
    lng: center.lng,
    category: input.category,
    radiusMeters: input.radiusMeters,
    limit: Math.max(input.requestedCount, 60)
  });

  if (
    places.length > 0 &&
    (searchFilters.minRating !== undefined ||
      searchFilters.maxRating !== undefined ||
      searchFilters.minReviewCount !== undefined ||
      searchFilters.maxReviewCount !== undefined ||
      searchFilters.openNowOnly ||
      searchFilters.websiteFilter !== "any" ||
      (searchFilters.excludePlaceIds?.length ?? 0) > 0 ||
      (searchFilters.excludeNames?.length ?? 0) > 0)
  ) {
    const details = await Promise.all(
      places.map((place) => placeDetails(place.place_id as string, input.apiKey))
    );
    const items = places.map((place, index) => ({
      place,
      detail: details[index]
    }));
    places = applySearchFilters(items, searchFilters).filtered.map((item) => item.place);
  }

  if (requestedPlaceIds.length > 0) {
    const allowed = new Set(requestedPlaceIds);
    places = places.filter((place) => allowed.has(String(place.place_id ?? "")));
  }

  if (Array.isArray(input.body.enrichedPreview) && reportFilters.pitchAngles?.length) {
    const previewRows = input.body.enrichedPreview as Array<Record<string, unknown>>;
    const allowedIds = new Set(
      applyReportFilters(
        previewRows.map((row) => ({
          place_id: String(row.place_id ?? ""),
          pitch_angle: String(row.pitch_angle ?? ""),
          email_candidates: String(row.email_candidates ?? ""),
          website_reachable: Boolean(row.website_reachable)
        })),
        reportFilters
      ).map((row) => row.place_id)
    );
    places = places.filter((place) => allowedIds.has(String(place.place_id ?? "")));
  } else if (reportFilters.hasEmailCandidate !== "any" || reportFilters.websiteReachable !== "any") {
    const previewRows = Array.isArray(input.body.enrichedPreview)
      ? (input.body.enrichedPreview as Array<Record<string, unknown>>)
      : [];
    if (previewRows.length > 0) {
      const allowedIds = new Set(
        applyReportFilters(
          previewRows.map((row) => ({
            place_id: String(row.place_id ?? ""),
            pitch_angle: String(row.pitch_angle ?? ""),
            email_candidates: String(row.email_candidates ?? ""),
            website_reachable: Boolean(row.website_reachable)
          })),
          reportFilters
        ).map((row) => row.place_id)
      );
      places = places.filter((place) => allowedIds.has(String(place.place_id ?? "")));
    }
  }

  places = places.slice(0, input.requestedCount);

  if (places.length === 0) {
    return {
      ok: false as const,
      error:
        "No businesses were found for this report. Try running a fresh search with a larger radius before exporting.",
      balance,
      required: creditsRequired
    };
  }

  const job = await createReportJob({
    userId: input.userId,
    requestedCount: input.requestedCount,
    cacheKey: input.cacheKey,
    query: {
      location: input.location,
      category: input.category,
      radiusMeters: input.radiusMeters,
      center,
      places
    }
  });

  const advanced = await advanceReportJob(job.id, input.userId, input.apiKey);

  return {
    ok: true as const,
    job: advanced ?? job
  };
}

export function serializeReportJobSummary(job: ReportJobRow) {
  const query = job.query ?? { places: [], location: "", category: "", radiusMeters: 0, center: { label: "" } };

  return {
    id: job.id,
    status: job.status,
    location: query.center?.label || query.location || "Unknown location",
    category: query.category,
    radiusMeters: query.radiusMeters,
    requestedCount: job.requested_count,
    processedCount: job.processed_count,
    chargedCredits: job.charged_credits,
    createdAt: job.created_at,
    filename: buildReportFilename(job),
    downloadReady: Boolean(job.csv)
  };
}

export function serializeReportJobStatus(job: ReportJobRow, balance?: number) {
  const emailsFound = job.results.filter((row) => String(row.email_candidates ?? "").length > 0)
    .length;
  const pitchesGenerated = job.results.filter((row) => String(row.recommended_pitch ?? "").length > 0)
    .length;
  const totalPlaces = job.query.places?.length ?? job.requested_count;
  const isReady = Boolean(job.csv) && (job.status === "completed" || job.status === "cancelled");

  return {
    id: job.id,
    status: job.status,
    requestedCount: job.requested_count,
    processedCount: job.processed_count,
    totalPlaces,
    chargedCredits: job.charged_credits,
    creditsCharged: job.charged_credits,
    error: job.error,
    downloadReady: isReady,
    csv: isReady ? job.csv : undefined,
    rows: isReady ? job.results : undefined,
    emailsFound,
    pitchesGenerated,
    balance
  };
}
