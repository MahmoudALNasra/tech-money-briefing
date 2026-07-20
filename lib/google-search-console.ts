import { createSign } from "crypto";

export type GscSearchRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SearchAnalyticsResponse = {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
};

function base64Url(input: string | Buffer) {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function normalizePrivateKey(raw: string) {
  return raw.replace(/\\n/g, "\n").trim();
}

function normalizeSiteUrl(raw: string) {
  const siteUrl = raw.trim();

  if (siteUrl.startsWith("sc-domain:")) {
    return siteUrl;
  }

  if (!/^https?:\/\//i.test(siteUrl)) {
    return `sc-domain:${siteUrl.replace(/^\/+|\/+$/g, "")}`;
  }

  return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
}

export function getGscConfig() {
  const siteUrl =
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() ||
    process.env.GSC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
    process.env.GSC_CLIENT_EMAIL?.trim();

  const privateKeyRaw =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GSC_PRIVATE_KEY;

  const oauthClientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    process.env.GSC_OAUTH_CLIENT_ID?.trim();
  const oauthClientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.GSC_OAUTH_CLIENT_SECRET?.trim();
  const oauthRefreshToken =
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim() ||
    process.env.GSC_OAUTH_REFRESH_TOKEN?.trim();

  if (!siteUrl) {
    throw new Error(
      "Missing GOOGLE_SEARCH_CONSOLE_SITE_URL (or GSC_SITE_URL / NEXT_PUBLIC_SITE_URL)"
    );
  }

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    return {
      authType: "oauth" as const,
      siteUrl: normalizeSiteUrl(siteUrl),
      oauthClientId,
      oauthClientSecret,
      oauthRefreshToken
    };
  }

  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing GSC auth. Use either GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }

  return {
    authType: "service_account" as const,
    siteUrl: normalizeSiteUrl(siteUrl),
    clientEmail,
    privateKey: normalizePrivateKey(privateKeyRaw)
  };
}

async function getServiceAccountAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${header}.${claim}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }),
    signal: AbortSignal.timeout(15000)
  });

  const json = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `GSC auth failed (${response.status}): ${String(json.error_description ?? json.error ?? response.statusText)}`
    );
  }

  const accessToken = String(json.access_token ?? "");
  if (!accessToken) {
    throw new Error("GSC auth returned an empty access token");
  }

  return accessToken;
}

async function getOauthAccessToken(input: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      refresh_token: input.refreshToken,
      grant_type: "refresh_token"
    }),
    signal: AbortSignal.timeout(15000)
  });

  const json = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `GSC OAuth refresh failed (${response.status}): ${String(json.error_description ?? json.error ?? response.statusText)}`
    );
  }

  const accessToken = String(json.access_token ?? "");
  if (!accessToken) {
    throw new Error("GSC OAuth refresh returned an empty access token");
  }

  return accessToken;
}

async function getAccessToken(config: ReturnType<typeof getGscConfig>) {
  if (config.authType === "oauth") {
    return getOauthAccessToken({
      clientId: config.oauthClientId,
      clientSecret: config.oauthClientSecret,
      refreshToken: config.oauthRefreshToken
    });
  }

  return getServiceAccountAccessToken(config.clientEmail, config.privateKey);
}

function formatGscDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchGscSearchAnalytics(options?: {
  days?: number;
  dimensions?: Array<"query" | "page" | "date">;
  rowLimit?: number;
  startRow?: number;
}) {
  const config = getGscConfig();
  const accessToken = await getAccessToken(config);
  const days = options?.days ?? Number(process.env.GSC_LOOKBACK_DAYS ?? 28);
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days);

  const dimensions = options?.dimensions ?? ["query", "page"];
  const encodedSite = encodeURIComponent(config.siteUrl);
  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        startDate: formatGscDate(startDate),
        endDate: formatGscDate(endDate),
        dimensions,
        rowLimit: options?.rowLimit ?? 2500,
        startRow: options?.startRow ?? 0
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  const json = (await response.json()) as SearchAnalyticsResponse & Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `GSC searchAnalytics failed (${response.status}): ${JSON.stringify(json)}`
    );
  }

  const queryIndex = dimensions.indexOf("query");
  const pageIndex = dimensions.indexOf("page");

  return (json.rows ?? []).map((row) => {
    const keys = row.keys ?? [];
    const impressions = Number(row.impressions ?? 0);
    const clicks = Number(row.clicks ?? 0);

    return {
      query: queryIndex >= 0 ? String(keys[queryIndex] ?? "").trim() : "",
      page: pageIndex >= 0 ? String(keys[pageIndex] ?? "").trim() : "",
      clicks,
      impressions,
      ctr: Number(row.ctr ?? (impressions > 0 ? clicks / impressions : 0)),
      position: Number(row.position ?? 0)
    } satisfies GscSearchRow;
  });
}

export async function fetchAllGscQueryPageRows(options?: { days?: number }) {
  const rowLimit = 2500;
  const rows: GscSearchRow[] = [];
  let startRow = 0;

  while (true) {
    const batch = await fetchGscSearchAnalytics({
      days: options?.days,
      dimensions: ["query", "page"],
      rowLimit,
      startRow
    });

    rows.push(...batch);

    if (batch.length < rowLimit) {
      break;
    }

    startRow += rowLimit;

    if (startRow >= 10000) {
      break;
    }
  }

  return rows;
}

export async function listGscSitemaps() {
  const config = getGscConfig();
  const accessToken = await getAccessToken(config);
  const encodedSite = encodeURIComponent(config.siteUrl);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20000)
    }
  );
  const json = (await response.json()) as {
    sitemap?: Array<{
      path?: string;
      lastSubmitted?: string;
      isPending?: boolean;
      isSitemapsIndex?: boolean;
      lastDownloaded?: string;
      warnings?: string;
      errors?: string;
      contents?: Array<{ type?: string; submitted?: string; indexed?: string }>;
    }>;
    error?: unknown;
  };

  if (!response.ok) {
    throw new Error(`GSC sitemaps.list failed (${response.status}): ${JSON.stringify(json)}`);
  }

  return json.sitemap ?? [];
}

export async function submitGscSitemap(sitemapUrl?: string) {
  const config = getGscConfig();
  const accessToken = await getAccessToken(config);
  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://techrevenuebrief.com";
  const feed = sitemapUrl?.trim() || `${siteBase}/sitemap.xml`;
  const encodedSite = encodeURIComponent(config.siteUrl);
  const encodedFeed = encodeURIComponent(feed);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedFeed}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20000)
    }
  );

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(
      `GSC sitemaps.submit failed (${response.status}): ${JSON.stringify(json)}`
    );
  }

  return { ok: true as const, sitemapUrl: feed };
}

export async function inspectGscUrl(inspectionUrl: string) {
  const config = getGscConfig();
  const accessToken = await getAccessToken(config);
  const response = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl: config.siteUrl,
        languageCode: "en-US"
      }),
      signal: AbortSignal.timeout(30000)
    }
  );
  const json = (await response.json()) as {
    inspectionResult?: {
      indexStatusResult?: {
        verdict?: string;
        coverageState?: string;
        robotsTxtState?: string;
        indexingState?: string;
        lastCrawlTime?: string;
        pageFetchState?: string;
        crawledAs?: string;
      };
      inspectionResultLink?: string;
    };
    error?: unknown;
  };

  if (!response.ok) {
    throw new Error(
      `GSC urlInspection failed (${response.status}): ${JSON.stringify(json)}`
    );
  }

  return json.inspectionResult ?? null;
}
