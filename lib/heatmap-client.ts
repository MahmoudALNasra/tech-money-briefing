"use client";

import { isHeatmapTrackingPath, type HeatmapPoint } from "@/lib/heatmap-analytics";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

const BATCH_FLUSH_MS = 12_000;
const MAX_BATCH_SIZE = 40;
const CURSOR_STOP_MS = 900;
const CURSOR_STOP_COOLDOWN_MS = 2_500;

let pointQueue: HeatmapPoint[] = [];
let flushTimer: number | null = null;
let lastCursorStopAt = 0;

function getDocumentMetrics() {
  const docW = Math.max(document.documentElement.scrollWidth, 1);
  const docH = Math.max(document.documentElement.scrollHeight, 1);

  return {
    doc_w: docW,
    doc_h: docH,
    vw: window.innerWidth,
    vh: window.innerHeight
  };
}

function createHeatmapPoint(
  type: HeatmapPoint["type"],
  clientX: number,
  clientY: number
): HeatmapPoint {
  const metrics = getDocumentMetrics();
  const x = Math.min(Math.max(clientX, 0), metrics.doc_w);
  const y = Math.min(Math.max(window.scrollY + clientY, 0), metrics.doc_h);

  return {
    type,
    x_pct: Math.round((x / metrics.doc_w) * 1000) / 10,
    y_pct: Math.round((y / metrics.doc_h) * 1000) / 10,
    ...metrics
  };
}

function scheduleFlush() {
  if (flushTimer !== null) {
    return;
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushHeatmapBatch();
  }, BATCH_FLUSH_MS);
}

export function enqueueHeatmapPoint(point: HeatmapPoint) {
  pointQueue.push(point);

  if (pointQueue.length >= MAX_BATCH_SIZE) {
    flushHeatmapBatch();
    return;
  }

  scheduleFlush();
}

export function flushHeatmapBatch() {
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (pointQueue.length === 0) {
    return;
  }

  const points = pointQueue.splice(0, MAX_BATCH_SIZE);

  trackAnalyticsEvent({
    event: "heatmap_batch",
    metadata: { points }
  });
}

export function recordHeatmapClick(event: MouseEvent) {
  if (event.button !== 0) {
    return;
  }

  enqueueHeatmapPoint(createHeatmapPoint("click", event.clientX, event.clientY));
}

export function recordHeatmapCursorStop(clientX: number, clientY: number) {
  const now = Date.now();

  if (now - lastCursorStopAt < CURSOR_STOP_COOLDOWN_MS) {
    return;
  }

  lastCursorStopAt = now;
  enqueueHeatmapPoint(createHeatmapPoint("cursor_stop", clientX, clientY));
}

export function shouldTrackHeatmapOnPath(pathname: string) {
  return isHeatmapTrackingPath(pathname);
}

export function getHeatmapCursorStopDelayMs() {
  return CURSOR_STOP_MS;
}
