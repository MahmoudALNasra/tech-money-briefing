"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAnalyticsApiUrl,
  getAnalyticsRequestInit
} from "@/lib/analytics-dashboard-client";
import {
  resolveAnalyticsPagePath,
  type HeatmapDeviceFilter,
  type HeatmapGridCell,
  type HeatmapInteractionFilter,
  type HeatmapWindow
} from "@/lib/heatmap-analytics";

type TopPage = {
  label: string;
  path?: string;
  count: number;
};

type HeatmapResponse = {
  generated_at: string;
  page_path: string;
  window: HeatmapWindow;
  device: HeatmapDeviceFilter;
  interaction: HeatmapInteractionFilter;
  batch_count: number;
  click_count: number;
  cursor_stop_count: number;
  point_count: number;
  peak: number;
  aspect_ratio: number;
  grid_size: number;
  grid: HeatmapGridCell[];
};

type PageHeatmapPanelProps = {
  topPages: TopPage[];
  dashboardToken?: string;
  adminAccess: boolean;
};

function getPagePath(page: TopPage) {
  return page.path?.trim() || resolveAnalyticsPagePath(page.label);
}

function cellIntensity(cell: HeatmapGridCell, peak: number, interaction: HeatmapInteractionFilter) {
  if (peak <= 0) {
    return 0;
  }

  const value =
    interaction === "clicks"
      ? cell.clicks
      : interaction === "cursor_stops"
        ? cell.cursor_stops
        : cell.total;

  return value / peak;
}

function heatColor(intensity: number, interaction: HeatmapInteractionFilter) {
  const alpha = Math.min(0.88, 0.12 + intensity * 0.76);

  if (interaction === "cursor_stops") {
    return `rgba(37, 99, 235, ${alpha})`;
  }

  if (interaction === "clicks") {
    return `rgba(220, 38, 38, ${alpha})`;
  }

  return `rgba(234, 88, 12, ${alpha})`;
}

function HeatmapCanvas({
  grid,
  gridSize,
  aspectRatio,
  peak,
  interaction
}: {
  grid: HeatmapGridCell[];
  gridSize: number;
  aspectRatio: number;
  peak: number;
  interaction: HeatmapInteractionFilter;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,#f5f5f4_0%,#e7e5e4_100%)]"
      style={{ aspectRatio: `${1} / ${aspectRatio}` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] bg-[size:4%_4%]" />
      {grid.map((cell) => {
        const intensity = cellIntensity(cell, peak, interaction);

        if (intensity <= 0) {
          return null;
        }

        return (
          <div
            key={`${cell.x}-${cell.y}`}
            className="absolute rounded-full blur-[1px]"
            style={{
              left: `${(cell.x / gridSize) * 100}%`,
              top: `${(cell.y / gridSize) * 100}%`,
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
              background: heatColor(intensity, interaction),
              transform: "scale(1.35)"
            }}
            title={`${cell.clicks} clicks · ${cell.cursor_stops} cursor stops`}
          />
        );
      })}
      <div className="absolute inset-x-0 top-0 border-b border-dashed border-stone-300/80 bg-white/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        Page top
      </div>
      <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-stone-300/80 bg-white/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        Page bottom
      </div>
    </div>
  );
}

export function PageHeatmapPanel({
  topPages,
  dashboardToken,
  adminAccess
}: PageHeatmapPanelProps) {
  const rankedPages = useMemo(() => topPages.slice(0, 5), [topPages]);
  const [selectedPath, setSelectedPath] = useState("");
  const [window, setWindow] = useState<HeatmapWindow>("24h");
  const [device, setDevice] = useState<HeatmapDeviceFilter>("all");
  const [interaction, setInteraction] = useState<HeatmapInteractionFilter>("all");
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedPath && rankedPages.length > 0) {
      setSelectedPath(getPagePath(rankedPages[0]));
    }
  }, [rankedPages, selectedPath]);

  useEffect(() => {
    if (!selectedPath) {
      return;
    }

    let cancelled = false;

    async function loadHeatmap() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page_path: selectedPath,
          window,
          device,
          interaction
        });
        const requestInit = await getAnalyticsRequestInit({
          dashboardToken,
          adminAccess
        });
        const response = await fetch(
          buildAnalyticsApiUrl(
            `/api/analytics/heatmap?${params.toString()}`,
            dashboardToken
          ),
          requestInit
        );
        const json = (await response.json()) as HeatmapResponse & { error?: string };

        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load heatmap.");
        }

        if (!cancelled) {
          setHeatmap(json);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setHeatmap(null);
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load heatmap."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHeatmap();

    return () => {
      cancelled = true;
    };
  }, [adminAccess, dashboardToken, device, interaction, selectedPath, window]);

  const selectedPage = rankedPages.find((page) => getPagePath(page) === selectedPath);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-5 py-4">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
          Page heatmaps
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Top pages by traffic. Select one to see where visitors click and pause their cursor.
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
            Top 5 pages
          </p>
          {rankedPages.length > 0 ? (
            rankedPages.map((page) => {
              const path = getPagePath(page);
              const isActive = path === selectedPath;

              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => setSelectedPath(path)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-ink bg-ink text-white"
                      : "border-stone-200 bg-stone-50 text-ink hover:border-stone-300"
                  }`}
                >
                  <p className="truncate text-sm font-semibold">{page.label}</p>
                  <p
                    className={`mt-1 text-xs ${
                      isActive ? "text-stone-200" : "text-stone-500"
                    }`}
                  >
                    {page.count} views · {path}
                  </p>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-stone-500">No page views in the last 30 minutes yet.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                Date range
              </span>
              <select
                value={window}
                onChange={(event) => setWindow(event.target.value as HeatmapWindow)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm"
              >
                <option value="30m">Last 30 minutes</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                Device
              </span>
              <select
                value={device}
                onChange={(event) =>
                  setDevice(event.target.value as HeatmapDeviceFilter)
                }
                className="mt-2 min-h-11 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm"
              >
                <option value="all">All devices</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                Interaction
              </span>
              <select
                value={interaction}
                onChange={(event) =>
                  setInteraction(event.target.value as HeatmapInteractionFilter)
                }
                className="mt-2 min-h-11 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm"
              >
                <option value="all">Clicks + cursor pauses</option>
                <option value="clicks">Clicks only</option>
                <option value="cursor_stops">Cursor pauses only</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-600">
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
              Clicks: {heatmap?.click_count ?? 0}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
              Cursor pauses: {heatmap?.cursor_stop_count ?? 0}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
              Batches: {heatmap?.batch_count ?? 0}
            </span>
            {isLoading ? <span>Loading heatmap...</span> : null}
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}

          {heatmap && heatmap.point_count > 0 ? (
            <HeatmapCanvas
              grid={heatmap.grid}
              gridSize={heatmap.grid_size}
              aspectRatio={heatmap.aspect_ratio}
              peak={heatmap.peak}
              interaction={interaction}
            />
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 text-center text-sm text-stone-500">
              {selectedPage
                ? "No click or cursor pause data for this page and filter yet. Heatmap collection starts after deploy."
                : "Select a top page to view its heatmap."}
            </div>
          )}

          <p className="text-xs leading-6 text-stone-500">
            Heatmaps use document-relative coordinates, so scroll depth is included. Red zones are
            clicks; blue zones are cursor pauses. Data excludes admin, analytics, and leads pages.
          </p>
        </div>
      </div>
    </section>
  );
}
