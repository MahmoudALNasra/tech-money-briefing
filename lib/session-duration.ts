type TimedEvent = {
  session_id: string;
  event_name: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

export type SessionDurationStats = {
  session_count: number;
  avg_seconds: number;
  median_seconds: number;
};

const MAX_SESSION_SECONDS = 3 * 60 * 60;

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  return sorted[mid];
}

export function computeSessionDurationStats(
  rows: TimedEvent[]
): SessionDurationStats {
  const bySession = new Map<
    string,
    { first: number; last: number; reportedSeconds: number | null }
  >();

  for (const row of rows) {
    if (!row.session_id) {
      continue;
    }

    const timestamp = new Date(row.created_at).getTime();
    const existing = bySession.get(row.session_id) ?? {
      first: timestamp,
      last: timestamp,
      reportedSeconds: null
    };

    existing.first = Math.min(existing.first, timestamp);
    existing.last = Math.max(existing.last, timestamp);

    if (row.event_name === "session_end") {
      const raw = row.metadata?.duration_seconds;
      const seconds =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? Number.parseInt(raw, 10)
            : NaN;

      if (Number.isFinite(seconds) && seconds > 0) {
        existing.reportedSeconds = seconds;
      }
    }

    bySession.set(row.session_id, existing);
  }

  const durations = [...bySession.values()]
    .map((session) => session.reportedSeconds ?? Math.round((session.last - session.first) / 1000))
    .filter((seconds) => seconds > 0 && seconds <= MAX_SESSION_SECONDS);

  if (durations.length === 0) {
    return { session_count: 0, avg_seconds: 0, median_seconds: 0 };
  }

  const total = durations.reduce((sum, value) => sum + value, 0);

  return {
    session_count: durations.length,
    avg_seconds: Math.round(total / durations.length),
    median_seconds: median(durations)
  };
}

export function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes < 60) {
    return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
