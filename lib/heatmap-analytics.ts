export type HeatmapPointType = "click" | "cursor_stop";

export type HeatmapPoint = {
  type: HeatmapPointType;
  x_pct: number;
  y_pct: number;
  vw?: number;
  vh?: number;
  doc_w?: number;
  doc_h?: number;
};

export type HeatmapGridCell = {
  x: number;
  y: number;
  clicks: number;
  cursor_stops: number;
  total: number;
};

export type HeatmapWindow = "30m" | "24h" | "7d";

export type HeatmapDeviceFilter = "all" | "mobile" | "tablet" | "desktop";

export type HeatmapInteractionFilter = "all" | "clicks" | "cursor_stops";

export const HEATMAP_GRID_SIZE = 25;

const RESERVED_HEATMAP_PATHS = new Set([
  "/analytics",
  "/admin",
  "/login",
  "/signup",
  "/profile",
  "/leads"
]);

export function isHeatmapTrackingPath(pathname: string) {
  const normalized = pathname.split("?")[0]?.trim() || "/";

  if (RESERVED_HEATMAP_PATHS.has(normalized)) {
    return false;
  }

  return !normalized.startsWith("/api/");
}

export function heatmapWindowToIso(window: HeatmapWindow, now = Date.now()) {
  const offsets: Record<HeatmapWindow, number> = {
    "30m": 30 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000
  };

  return new Date(now - offsets[window]).toISOString();
}

export function sanitizeHeatmapPoint(value: unknown): HeatmapPoint | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const point = value as Record<string, unknown>;
  const type = point.type;

  if (type !== "click" && type !== "cursor_stop") {
    return null;
  }

  const x_pct =
    typeof point.x_pct === "number" && Number.isFinite(point.x_pct)
      ? Math.min(100, Math.max(0, point.x_pct))
      : null;
  const y_pct =
    typeof point.y_pct === "number" && Number.isFinite(point.y_pct)
      ? Math.min(100, Math.max(0, point.y_pct))
      : null;

  if (x_pct === null || y_pct === null) {
    return null;
  }

  return {
    type,
    x_pct: Math.round(x_pct * 10) / 10,
    y_pct: Math.round(y_pct * 10) / 10,
    vw:
      typeof point.vw === "number" && Number.isFinite(point.vw)
        ? Math.round(point.vw)
        : undefined,
    vh:
      typeof point.vh === "number" && Number.isFinite(point.vh)
        ? Math.round(point.vh)
        : undefined,
    doc_w:
      typeof point.doc_w === "number" && Number.isFinite(point.doc_w)
        ? Math.round(point.doc_w)
        : undefined,
    doc_h:
      typeof point.doc_h === "number" && Number.isFinite(point.doc_h)
        ? Math.round(point.doc_h)
        : undefined
  };
}

export function sanitizeHeatmapBatchMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { points: [] as HeatmapPoint[] };
  }

  const rawPoints = (value as { points?: unknown }).points;
  const points = Array.isArray(rawPoints)
    ? rawPoints
        .slice(0, 80)
        .map(sanitizeHeatmapPoint)
        .filter((point): point is HeatmapPoint => Boolean(point))
    : [];

  return { points };
}

export function aggregateHeatmapPoints(
  points: HeatmapPoint[],
  options: {
    interaction?: HeatmapInteractionFilter;
    gridSize?: number;
  } = {}
) {
  const gridSize = options.gridSize ?? HEATMAP_GRID_SIZE;
  const interaction = options.interaction ?? "all";
  const cells = new Map<string, HeatmapGridCell>();
  let maxDocWidth = 0;
  let maxDocHeight = 0;
  let pointCount = 0;

  for (const point of points) {
    if (interaction === "clicks" && point.type !== "click") {
      continue;
    }

    if (interaction === "cursor_stops" && point.type !== "cursor_stop") {
      continue;
    }

    pointCount += 1;
    maxDocWidth = Math.max(maxDocWidth, point.doc_w ?? 0);
    maxDocHeight = Math.max(maxDocHeight, point.doc_h ?? 0);

    const x = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor((point.x_pct / 100) * gridSize))
    );
    const y = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor((point.y_pct / 100) * gridSize))
    );
    const key = `${x},${y}`;
    const existing = cells.get(key) ?? {
      x,
      y,
      clicks: 0,
      cursor_stops: 0,
      total: 0
    };

    if (point.type === "click") {
      existing.clicks += 1;
    } else {
      existing.cursor_stops += 1;
    }

    existing.total += 1;
    cells.set(key, existing);
  }

  const grid = [...cells.values()];
  const peak = grid.reduce((max, cell) => Math.max(max, cell.total), 0);

  return {
    grid,
    peak,
    point_count: pointCount,
    aspect_ratio:
      maxDocWidth > 0 && maxDocHeight > 0
        ? Math.round((maxDocHeight / maxDocWidth) * 1000) / 1000
        : 1.4,
    grid_size: gridSize
  };
}

export function resolveAnalyticsPagePath(label: string) {
  const trimmed = label.trim();

  if (trimmed === "Homepage (/)") {
    return "/";
  }

  const match = trimmed.match(/\((\/[^)]+)\)$/);

  if (match?.[1]) {
    return match[1];
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return trimmed;
}
