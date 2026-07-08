type AnalyticsCountRow = {
  event_name: string;
  session_id: string | null;
  page_path: string | null;
  created_at: string;
};

export function formatAnalyticsPagePath(path: string | null | undefined) {
  const normalized = path?.trim() || "/";

  if (normalized === "/") {
    return "Homepage (/)";
  }

  if (normalized === "/leads") {
    return "Leads (/leads)";
  }

  if (normalized === "/tools") {
    return "Tools (/tools)";
  }

  return normalized;
}

export function countBy<T extends string | null>(
  rows: T[],
  limit = 10
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = row?.trim() || "(unknown)";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function countPageViewsByPath(
  rows: AnalyticsCountRow[],
  limit = 8
): Array<{ label: string; path: string; count: number }> {
  const counts = new Map<string, { label: string; path: string; count: number }>();

  for (const row of rows) {
    if (row.event_name !== "page_view") {
      continue;
    }

    const path = row.page_path?.trim() || "/";
    const label = formatAnalyticsPagePath(path);
    const existing = counts.get(path);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(path, { label, path, count: 1 });
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export function countLandingPagesByPath(
  rows: AnalyticsCountRow[],
  limit = 8
): Array<{ label: string; path: string; count: number }> {
  const firstPageViewBySession = new Map<string, AnalyticsCountRow>();

  for (const row of rows) {
    if (row.event_name !== "page_view" || !row.session_id) {
      continue;
    }

    const existing = firstPageViewBySession.get(row.session_id);

    if (!existing || row.created_at < existing.created_at) {
      firstPageViewBySession.set(row.session_id, row);
    }
  }

  const counts = new Map<string, { label: string; path: string; count: number }>();

  for (const row of firstPageViewBySession.values()) {
    const path = row.page_path?.trim() || "/";
    const label = formatAnalyticsPagePath(path);
    const existing = counts.get(path);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(path, { label, path, count: 1 });
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}
