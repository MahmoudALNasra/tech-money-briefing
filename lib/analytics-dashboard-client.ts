import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";

export function buildAnalyticsApiUrl(path: string, dashboardToken?: string) {
  if (!dashboardToken) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}token=${encodeURIComponent(dashboardToken)}`;
}

export async function getAnalyticsRequestInit(options: {
  dashboardToken?: string;
  adminAccess?: boolean;
}) {
  if (options.dashboardToken) {
    return {};
  }

  if (options.adminAccess) {
    return { headers: await getBusinessDataAuthHeaders() };
  }

  try {
    const headers = await getBusinessDataAuthHeaders();
    if (headers.Authorization) {
      return { headers };
    }
  } catch {
    // Fall back to token-only access when Supabase is unavailable client-side.
  }

  return {};
}

export function withClientTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race<T | null>([
    promise,
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    })
  ]);
}
