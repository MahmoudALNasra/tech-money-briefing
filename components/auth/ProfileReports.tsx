"use client";

import { useEffect, useState } from "react";

import { LoadingMascot } from "@/components/business-data/LoadingMascot";
import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";
import {
  requestGoogleDriveIdentityLink,
  uploadCsvWorkbookToGoogleDrive
} from "@/lib/business-data-drive";
import { downloadFormattedWorkbook, makeFormattedWorkbookBlob } from "@/lib/business-data-workbook";
import { formatCreditBalance } from "@/lib/format-token-balance";

type SavedReport = {
  id: string;
  status: string;
  location: string;
  category: string;
  requestedCount: number;
  processedCount: number;
  chargedCredits: number;
  createdAt: string;
  filename: string;
  downloadReady: boolean;
};

const profileDriveReportKey = "trb.profile.driveReportId";

export function ProfileReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/business-data/reports", {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as { reports?: SavedReport[]; error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not load saved reports.");
      }

      setReports(json.reports ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId =
      params.get("reportId") ?? window.sessionStorage.getItem(profileDriveReportKey);

    if (params.get("drive") !== "connected" || !reportId) {
      return;
    }

    window.sessionStorage.removeItem(profileDriveReportKey);
    window.history.replaceState({}, "", "/profile#reports");

    void (async () => {
      setActiveAction(`drive:${reportId}`);
      setMessage("Sending your saved report to Google Drive...");

      try {
        const response = await fetch(`/api/business-data/reports/${reportId}`, {
          headers: await getBusinessDataAuthHeaders()
        });
        const json = (await response.json()) as {
          csv?: string;
          filename?: string;
          error?: string;
        };

        if (!response.ok || !json.csv || !json.filename) {
          throw new Error(json.error ?? "Could not load the saved report.");
        }

        const workbookBlob = await makeFormattedWorkbookBlob(json.csv);
        const upload = await uploadCsvWorkbookToGoogleDrive({
          csv: json.csv,
          filename: json.filename,
          workbookBlob
        });

        if (upload.webViewLink) {
          window.open(upload.webViewLink, "_blank", "noopener,noreferrer");
        }

        setMessage(`Uploaded ${upload.name} to Google Drive.`);
      } catch (error) {
        const driveMessage = error instanceof Error ? error.message : String(error);
        if (driveMessage === "GOOGLE_DRIVE_AUTH_REQUIRED") {
          window.sessionStorage.setItem(profileDriveReportKey, reportId);
          const returnPath = `/profile?drive=connected&reportId=${encodeURIComponent(reportId)}`;
          const { error: oauthError } = await requestGoogleDriveIdentityLink(returnPath);
          if (oauthError) {
            setMessage(oauthError.message);
          } else {
            window.location.href = returnPath;
          }
          return;
        }

        setMessage(driveMessage);
      } finally {
        setActiveAction(null);
      }
    })();
  }, []);

  const downloadReport = async (report: SavedReport) => {
    setActiveAction(`download:${report.id}`);
    setMessage("");

    try {
      const response = await fetch(`/api/business-data/reports/${report.id}`, {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as {
        csv?: string;
        filename?: string;
        error?: string;
      };

      if (!response.ok || !json.csv) {
        throw new Error(json.error ?? "Could not download this report.");
      }

      await downloadFormattedWorkbook(json.csv, json.filename ?? report.filename);
      setMessage(`Downloaded ${report.filename}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setActiveAction(null);
    }
  };

  const exportReportToDrive = async (report: SavedReport) => {
    setActiveAction(`drive:${report.id}`);
    setMessage("Preparing Google Drive export...");

    try {
      const response = await fetch(`/api/business-data/reports/${report.id}`, {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as {
        csv?: string;
        filename?: string;
        error?: string;
      };

      if (!response.ok || !json.csv || !json.filename) {
        throw new Error(json.error ?? "Could not load this report for Drive export.");
      }

      const workbookBlob = await makeFormattedWorkbookBlob(json.csv);
      const upload = await uploadCsvWorkbookToGoogleDrive({
        csv: json.csv,
        filename: json.filename,
        workbookBlob
      });

      if (upload.webViewLink) {
        window.open(upload.webViewLink, "_blank", "noopener,noreferrer");
      }

      setMessage(`Uploaded ${upload.name} to Google Drive.`);
    } catch (error) {
      const driveMessage = error instanceof Error ? error.message : String(error);
      if (driveMessage === "GOOGLE_DRIVE_AUTH_REQUIRED") {
        window.sessionStorage.setItem(profileDriveReportKey, report.id);
        const returnPath = `/profile?drive=connected&reportId=${encodeURIComponent(report.id)}`;
        const { error: oauthError } = await requestGoogleDriveIdentityLink(returnPath);
        if (oauthError) {
          setMessage(oauthError.message);
        } else {
          await exportReportToDrive(report);
        }
        return;
      }

      setMessage(driveMessage);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section
      id="reports"
      className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"
    >
      <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">Reports</p>
      <h2 className="mt-3 text-2xl font-black text-ink">Generated reports</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Every completed business data report is saved here so you can download the Excel workbook
        again or send it to Google Drive without regenerating it.
      </p>
      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      ) : null}
      {isLoading ? (
        <LoadingMascot
          label="Loading saved reports..."
          description="The AI cat is looking for completed exports you can download or send to Drive."
        />
      ) : reports.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-600">
          No completed reports yet. Generate your first report from the business data tool.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black text-ink">
                    {report.category} near {report.location}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(report.createdAt).toLocaleString()} ·{" "}
                    {formatCreditBalance(report.processedCount)} businesses ·{" "}
                    {formatCreditBalance(report.chargedCredits)} credits used
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-600">{report.filename}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void downloadReport(report)}
                    disabled={Boolean(activeAction)}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {activeAction === `download:${report.id}` ? "Downloading..." : "Download Excel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportReportToDrive(report)}
                    disabled={Boolean(activeAction)}
                    className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    {activeAction === `drive:${report.id}` ? "Opening Drive..." : "Export to Drive"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
