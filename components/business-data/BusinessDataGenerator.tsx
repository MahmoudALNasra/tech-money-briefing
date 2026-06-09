"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";

import { ContactForm } from "@/components/contact/ContactForm";
import { ExportLoadingOverlay } from "@/components/business-data/ExportLoadingOverlay";
import { LoadingMascot } from "@/components/business-data/LoadingMascot";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle
} from "@/components/business-data/TurnstileWidget";
import { useDataLayer } from "@/hooks/useDataLayer";
import {
  getCategoryRecommendations,
  getGroupedCategoryOptions
} from "@/lib/business-data-category-groups";
import { BUSINESS_DATA_CATEGORIES } from "@/lib/business-data-categories";
import {
  fetchWalletBalance,
  getBusinessDataAuthHeaders
} from "@/lib/business-data-client";
import {
  requestGoogleDriveIdentityLink,
  uploadCsvWorkbookToGoogleDrive
} from "@/lib/business-data-drive";
import {
  clearGoogleDriveAccessToken,
  resolveGoogleDriveAccessToken
} from "@/lib/google-drive-token";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  BUSINESS_DATA_CREDIT_BUNDLES,
  BUSINESS_DATA_REPORT_LIMITS,
  SUBSCRIPTION_CREDIT_GRANT,
  clampBusinessDataReportLimit,
  getBusinessDataExportTokenCost,
  type BusinessDataCreditBundleId
} from "@/lib/business-data-token-config";
import { formatCreditBalance } from "@/lib/format-token-balance";
import {
  getTurnstileLocalhostDevMessage,
  isLocalDevHostname,
  isTurnstileSiteKeyConfigured,
  shouldRenderTurnstileWidget
} from "@/lib/turnstile";

type BusinessResult = {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  mapsUrl: string;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  lat: number | null;
  lng: number | null;
};

type SearchCenter = {
  lat: number;
  lng: number;
  label: string;
  source: "suggestion" | "pin" | "demo";
};

type PlaceSuggestion = {
  placeId: string;
  label: string;
  secondaryLabel: string;
  lat: number | null;
  lng: number | null;
  types: string[];
};

type SearchResponse = {
  provider: "google_places" | "demo";
  query: {
    location: string;
    category: string;
    radiusMeters: number;
  };
  paidAccess?: boolean;
  tokenBalance?: number;
  exportTokenCost?: number;
  center: {
    lat: number;
    lng: number;
    label: string;
  };
  previewLimit: number;
  totalAvailableEstimate: number;
  lockedCount: number;
  results: BusinessResult[];
};

type SearchSnapshot = {
  location: string;
  category: string;
  radiusMeters: number;
  selectedCenter: SearchCenter;
  search: SearchResponse | null;
  paidAccess: boolean;
  reportResultLimit?: number;
  readyReportCacheKey?: string;
  reportJobId?: string;
  pendingDriveUpload?: boolean;
  savedAt: number;
};

type EnrichedExportRow = {
  place_id: string;
  name: string;
  website_analysis: string;
  business_opportunity_summary: string;
  recommended_pitch: string;
  pitch_angle: string;
  email_candidates?: string;
  opportunity_signal?: string;
};

type PaidExportCsv = {
  csv: string;
  filename: string;
  fromCache: boolean;
  rows: EnrichedExportRow[];
  creditsCharged?: number;
  tokensCharged?: number;
};

type ReportJobStatusResponse = {
  id: string;
  status: "running" | "completed" | "cancelled" | "failed";
  requestedCount: number;
  processedCount: number;
  totalPlaces: number;
  chargedCredits: number;
  creditsCharged: number;
  downloadReady: boolean;
  csv?: string;
  rows?: EnrichedExportRow[];
  emailsFound?: number;
  pitchesGenerated?: number;
  balance?: number;
  error?: string;
};

type AccountProfile = {
  name: string;
  email: string;
  avatarUrl: string;
};

type GoogleMapConstructor = new (
  element: HTMLElement,
  options: {
    center: { lat: number; lng: number };
    zoom: number;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }
) => GoogleMapInstance;

type GoogleMarkerConstructor = new (options: {
  position: { lat: number; lng: number };
  map: GoogleMapInstance;
  title?: string;
  icon?: string;
  label?: string;
}) => GoogleMarkerInstance;

type GoogleMapsConstructors = {
  Map: GoogleMapConstructor;
  Marker: GoogleMarkerConstructor;
  LatLngBounds: GoogleLatLngBoundsConstructor;
};

type GoogleLatLngBoundsConstructor = new () => GoogleLatLngBoundsInstance;

type GoogleLatLngBoundsInstance = {
  extend: (position: { lat: number; lng: number }) => void;
};

type GoogleMapsWindow = Window & {
  __initBusinessDataGoogleMaps?: () => void;
  google?: {
    maps?: {
      importLibrary?: (library: string) => Promise<Record<string, unknown>>;
      Map?: GoogleMapConstructor;
      Marker?: GoogleMarkerConstructor;
      event?: {
        clearListeners: (instance: GoogleMapInstance, eventName: string) => void;
      };
    };
  };
};

type GoogleMapInstance = {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: GoogleLatLngBoundsInstance, padding?: number) => void;
  addListener: (
    eventName: string,
    handler: (event: { latLng?: { lat: () => number; lng: () => number } }) => void
  ) => void;
};

type GoogleMarkerInstance = {
  setPosition: (position: { lat: number; lng: number }) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (eventName: string, handler: () => void) => void;
};

const browserMapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim();
const defaultCenter: SearchCenter = {
  lat: 25.1972,
  lng: 55.2744,
  label: "Museum of the Future, Dubai",
  source: "demo"
};
const searchCachePrefix = "trb-business-data-search:";
const exportCachePrefix = "trb-business-data-export-ai-xlsx:";
const exportRowsCachePrefix = "trb-business-data-export-ai-xlsx-rows:";
const mapImageCachePrefix = "trb-business-data-map-image:";
const lastSearchCacheKey = `${searchCachePrefix}last`;
const driveReconnectCacheKey = "trb-business-data-drive-reconnect-cache";
const driveReconnectSnapshotKey = "trb-business-data-drive-reconnect-snapshot";
const reportReadyCachePrefix = "trb-business-data-report-ready:";
const MAP_IMAGE_COOLDOWN_MS = 30_000;
const freeRadiusLimitMeters = 1609;
const droppedPinIconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
const mapPinLabels = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const radiusOptions = Array.from({ length: 10 }, (_, index) => {
  const miles = (index + 1) * 0.5;
  const kilometers = miles * 1.609344;

  return {
    miles,
    meters: Math.round(miles * 1609.344),
    label: `${miles.toFixed(1)} mi (${kilometers.toFixed(1)} km)`
  };
});

const subscriptionShowcaseItems: Array<{
  title: string;
  copy: string;
}> = [
  {
    title: "Download map image",
    copy: "Export a branded map image with the search center and numbered business pins."
  },
  {
    title: "Detailed analysis",
    copy: "Get website checks, opportunity signals, business summaries, and outreach angles."
  },
  {
    title: "Export to Google Drive",
    copy: "Generate once, then send the finished Excel workbook straight to your Drive."
  },
  {
    title: "Search up to 5 miles",
    copy: "Free previews stop at 1 mile. Full access expands the scan radius up to 5 miles."
  },
  {
    title: "Process up to 60 businesses",
    copy: "Choose 5, 10, 20, 30, 40, 50, or all found up to the report cap."
  },
  {
    title: "Get outreach data",
    copy: "Pull phone, website, Google Maps links, public email candidates, and contact-page signals."
  }
];

const creditBundleOptions = [
  BUSINESS_DATA_CREDIT_BUNDLES.starter,
  BUSINESS_DATA_CREDIT_BUNDLES.growth,
  BUSINESS_DATA_CREDIT_BUNDLES.agency
];

const supportedPaymentMethods = ["Card", "Apple Pay", "Google Pay", "Link", "Local methods"];
const disabledTurnstileRuntimeSnapshot = "0:0";

function subscribeTurnstileRuntime() {
  return () => {};
}

function getTurnstileRuntimeSnapshot() {
  if (typeof window === "undefined") {
    return disabledTurnstileRuntimeSnapshot;
  }

  const hostname = window.location.hostname;
  const widgetEnabled = shouldRenderTurnstileWidget(hostname);
  const localhostBlocked =
    isTurnstileSiteKeyConfigured() &&
    isLocalDevHostname(hostname) &&
    !widgetEnabled;

  return `${widgetEnabled ? "1" : "0"}:${localhostBlocked ? "1" : "0"}`;
}

function isCreditBundleId(value: unknown): value is BusinessDataCreditBundleId {
  return creditBundleOptions.some((bundle) => bundle.id === value);
}

function SupportedPaymentMethods({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone-500">
        Secure payment by Stripe
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {supportedPaymentMethods.map((method) => (
          <span
            key={method}
            className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[0.68rem] font-black text-stone-700 shadow-sm"
          >
            {method}
          </span>
        ))}
      </div>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Stripe shows the exact eligible methods by country, device, currency, and your Stripe
          Dashboard settings.
        </p>
      ) : null}
    </div>
  );
}

function formatStatus(openNow: boolean | null) {
  if (openNow === true) {
    return "Open now";
  }

  if (openNow === false) {
    return "Closed now";
  }

  return "Hours unknown";
}

function getMapPinLabel(index: number) {
  return mapPinLabels[index] ?? String(index + 1);
}

function getBusinessPinIconUrl(label: string) {
  const safeLabel = label.replace(/[<>&"']/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="66" viewBox="0 0 54 66">
      <path d="M27 63C22 54 8 40 8 25 8 14 16.5 5 27 5s19 9 19 20c0 15-14 29-19 38z" fill="#dc2626" stroke="#7f1d1d" stroke-width="4"/>
      <circle cx="27" cy="24" r="15" fill="#ffffff" stroke="#fecaca" stroke-width="3"/>
      <text x="27" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" fill="#991b1b">${safeLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getReportLimitOptions(totalAvailableEstimate?: number) {
  const available = Math.max(
    Math.round(totalAvailableEstimate ?? BUSINESS_DATA_REPORT_LIMITS.default),
    1
  );
  const maxAvailable = Math.min(available, BUSINESS_DATA_REPORT_LIMITS.max);

  if (maxAvailable < BUSINESS_DATA_REPORT_LIMITS.min) {
    return [maxAvailable];
  }

  const baseOptions = [5, 10, 20, 30, 40, 50, BUSINESS_DATA_REPORT_LIMITS.max].filter(
    (value) => value <= maxAvailable
  );
  const options = new Set([
    BUSINESS_DATA_REPORT_LIMITS.min,
    ...baseOptions,
    maxAvailable
  ]);

  return Array.from(options).sort((left, right) => left - right);
}

function formatBusinessCount(count: number) {
  return count === 1 ? "1 business" : `${count} businesses`;
}

function csvEscape(value: string | number | boolean | null) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function previewToCsv(results: BusinessResult[]) {
  const headers = [
    "name",
    "address",
    "phone",
    "website",
    "google_maps_url",
    "rating",
    "total_reviews",
    "open_now",
    "place_id",
    "lat",
    "lng"
  ];

  const rows = results.map((result) => [
    result.name,
    result.address,
    result.phone,
    result.website,
    result.mapsUrl,
    result.rating,
    result.reviewCount,
    result.openNow,
    result.placeId,
    result.lat,
    result.lng
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function mapScriptId() {
  return "google-maps-business-data";
}

function isGoogleMapsBootstrapReady(mapsWindow: GoogleMapsWindow) {
  return Boolean(mapsWindow.google?.maps?.importLibrary || mapsWindow.google?.maps?.Map);
}

function loadGoogleMapsBootstrap() {
  return new Promise<boolean>((resolve) => {
    if (!browserMapKey) {
      resolve(false);
      return;
    }

    const mapsWindow = window as GoogleMapsWindow;
    if (isGoogleMapsBootstrapReady(mapsWindow)) {
      resolve(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resolve(isGoogleMapsBootstrapReady(mapsWindow));
    }, 15000);
    const finish = () => {
      window.clearTimeout(timeoutId);
      resolve(isGoogleMapsBootstrapReady(mapsWindow));
    };

    const existing = document.getElementById(mapScriptId()) as HTMLScriptElement | null;
    if (existing) {
      mapsWindow.__initBusinessDataGoogleMaps = finish;
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => {
        window.clearTimeout(timeoutId);
        resolve(false);
      }, { once: true });
      return;
    }

    mapsWindow.__initBusinessDataGoogleMaps = finish;

    const script = document.createElement("script");
    script.id = mapScriptId();
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(browserMapKey)}&loading=async&callback=__initBusinessDataGoogleMaps`;
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

let googleMapsConstructorsPromise: Promise<GoogleMapsConstructors | null> | null = null;

async function loadGoogleMapsConstructors() {
  if (!browserMapKey) {
    return null;
  }

  if (!googleMapsConstructorsPromise) {
    googleMapsConstructorsPromise = (async () => {
      const loaded = await loadGoogleMapsBootstrap();
      if (!loaded) {
        return null;
      }

      const mapsApi = (window as GoogleMapsWindow).google?.maps;
      if (!mapsApi) {
        return null;
      }

      if (mapsApi.importLibrary) {
        try {
          const mapsLibrary = await mapsApi.importLibrary("maps");
          const markerLibrary = await mapsApi.importLibrary("marker");
          const coreLibrary = await mapsApi.importLibrary("core");
          const Map = mapsLibrary.Map as GoogleMapConstructor | undefined;
          const Marker = markerLibrary.Marker as GoogleMarkerConstructor | undefined;
          const LatLngBounds =
            coreLibrary.LatLngBounds as GoogleLatLngBoundsConstructor | undefined;

          if (
            typeof Map === "function" &&
            typeof Marker === "function" &&
            typeof LatLngBounds === "function"
          ) {
            return { Map, Marker, LatLngBounds };
          }
        } catch {
          return null;
        }
      }

      if (
        typeof mapsApi.Map === "function" &&
        typeof mapsApi.Marker === "function" &&
        typeof (mapsApi as { LatLngBounds?: GoogleLatLngBoundsConstructor }).LatLngBounds ===
          "function"
      ) {
        return {
          Map: mapsApi.Map,
          Marker: mapsApi.Marker,
          LatLngBounds: (mapsApi as { LatLngBounds: GoogleLatLngBoundsConstructor }).LatLngBounds
        };
      }

      return null;
    })();
  }

  return googleMapsConstructorsPromise;
}

function readSearchSnapshot(cacheKey: string | null) {
  if (!cacheKey) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`${searchCachePrefix}${cacheKey}`);
    if (!raw) {
      return null;
    }

    const snapshot = JSON.parse(raw) as Partial<SearchSnapshot>;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (
      typeof snapshot.location !== "string" ||
      typeof snapshot.category !== "string" ||
      typeof snapshot.radiusMeters !== "number" ||
      !snapshot.selectedCenter ||
      typeof snapshot.savedAt !== "number" ||
      snapshot.savedAt < oneDayAgo
    ) {
      return null;
    }

    return snapshot as SearchSnapshot;
  } catch {
    return null;
  }
}

function writeSearchSnapshot(cacheKey: string, snapshot: SearchSnapshot) {
  window.localStorage.setItem(`${searchCachePrefix}${cacheKey}`, JSON.stringify(snapshot));
  window.localStorage.setItem(lastSearchCacheKey, cacheKey);
}

function readDriveReconnectSnapshot() {
  try {
    const raw = window.sessionStorage.getItem(driveReconnectSnapshotKey);
    if (!raw) {
      return null;
    }

    const snapshot = JSON.parse(raw) as Partial<SearchSnapshot>;
    if (
      typeof snapshot.location !== "string" ||
      typeof snapshot.category !== "string" ||
      typeof snapshot.radiusMeters !== "number" ||
      !snapshot.selectedCenter ||
      typeof snapshot.savedAt !== "number"
    ) {
      return null;
    }

    return snapshot as SearchSnapshot;
  } catch {
    return null;
  }
}

function makeExportCacheKey(input: {
  category: string;
  radiusMeters: number;
  selectedCenter: SearchCenter;
  resultLimit?: number;
}) {
  return [
    input.category,
    input.radiusMeters,
    input.selectedCenter.lat.toFixed(5),
    input.selectedCenter.lng.toFixed(5),
    input.resultLimit ?? "default"
  ].join(":");
}

function readReadyReportFromStorage(input: {
  category: string;
  radiusMeters: number;
  selectedCenter: SearchCenter;
  resultLimit: number;
}): PaidExportCsv | null {
  const cacheKey = `${reportReadyCachePrefix}${makeExportCacheKey({
    ...input,
    resultLimit: input.resultLimit
  })}`;
  const cachedReady = readReadyReportByCacheKey(cacheKey);

  if (cachedReady) {
    return cachedReady;
  }

  const legacyCsvKey = `${exportCachePrefix}${makeExportCacheKey(input)}`;
  const legacyRowsKey = `${exportRowsCachePrefix}${makeExportCacheKey(input)}`;
  const legacyCsv = window.localStorage.getItem(legacyCsvKey);
  const legacyRowsRaw = window.localStorage.getItem(legacyRowsKey);

  if (!legacyCsv) {
    return null;
  }

  let legacyRows: EnrichedExportRow[] = [];
  if (legacyRowsRaw) {
    try {
      legacyRows = JSON.parse(legacyRowsRaw) as EnrichedExportRow[];
    } catch {
      legacyRows = [];
    }
  }

  if (!hasExportDataRows(legacyCsv, legacyRows.length ? legacyRows : undefined)) {
    return null;
  }

  return {
    csv: legacyCsv,
    filename: `business-data-export-${input.category}-${input.resultLimit}.xlsx`,
    fromCache: true,
    rows: legacyRows,
    creditsCharged: 0
  };
}

function readReadyReportByCacheKey(cacheKey: string | null) {
  if (!cacheKey) {
    return null;
  }

  const cachedReady = window.localStorage.getItem(cacheKey);

  if (!cachedReady) {
    return null;
  }

  try {
    const parsed = JSON.parse(cachedReady) as PaidExportCsv;
    if (hasExportDataRows(parsed.csv, parsed.rows)) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(cacheKey);
  }

  return null;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function hasExportDataRows(csv: string, rows?: EnrichedExportRow[]) {
  if (rows && rows.length > 0) {
    return true;
  }

  return csv.trim().split(/\r?\n/).length > 1;
}

async function makeFormattedWorkbookBlob(csv: string) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(csv, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1:A1");
  const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: ""
  });

  if (rows.length <= 1) {
    throw new Error("The export did not contain any business rows. Please run the search again before exporting.");
  }

  const headers = rows[0] ?? [];
  const wideColumns = new Set([
    "address",
    "website",
    "google_maps_url",
    "email_candidates",
    "website_title",
    "meta_description",
    "homepage_headings",
    "social_links",
    "contact_url",
    "opportunity_signal",
    "website_analysis",
    "business_opportunity_summary",
    "recommended_pitch"
  ]);
  const extraWideColumns = new Set([
    "opportunity_signal",
    "website_analysis",
    "business_opportunity_summary",
    "recommended_pitch"
  ]);

  worksheet["!cols"] = headers.map((header) => {
    if (extraWideColumns.has(header)) {
      return { wch: 72 };
    }

    if (wideColumns.has(header)) {
      return { wch: 36 };
    }

    return { wch: 20 };
  });

  worksheet["!rows"] = rows.map((row, index) => {
    if (index === 0) {
      return { hpt: 28 };
    }

    const tallestCell = Math.max(
      2,
      ...row.map((cell) => {
        const text = String(cell ?? "");
        const explicitLines = text.split("\n").length;
        const wrappedLines = Math.ceil(text.length / 70);
        return Math.max(explicitLines, wrappedLines);
      })
    );

    return { hpt: Math.min(150, Math.max(34, tallestCell * 16)) };
  });

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[address] as
        | { s?: { alignment?: { wrapText?: boolean; vertical?: string } } }
        | undefined;

      if (cell) {
        cell.s = {
          ...(cell.s ?? {}),
          alignment: {
            ...(cell.s?.alignment ?? {}),
            wrapText: true,
            vertical: "top"
          }
        };
      }
    }
  }

  const data = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true
  }) as ArrayBuffer;

  return new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

async function downloadFormattedWorkbook(csv: string, filename: string) {
  const blob = await makeFormattedWorkbookBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BusinessDataGenerator() {
  const pushToDataLayer = useDataLayer();
  const [location, setLocation] = useState(defaultCenter.label);
  const [category, setCategory] = useState("restaurant");
  const [radiusMeters, setRadiusMeters] = useState(radiusOptions[0].meters);
  const [selectedCenter, setSelectedCenter] = useState<SearchCenter>(defaultCenter);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [activeResultPlaceId, setActiveResultPlaceId] = useState<string | null>(null);
  const [isCenterPreviewOpen, setIsCenterPreviewOpen] = useState(false);
  const [paidAccess, setPaidAccess] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [pendingCheckoutBundle, setPendingCheckoutBundle] =
    useState<BusinessDataCreditBundleId | null>(null);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isMapImageLoading, setIsMapImageLoading] = useState(false);
  const [mapImageCooldownUntil, setMapImageCooldownUntil] = useState(0);
  const [mapCooldownTick, setMapCooldownTick] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [exportSummary, setExportSummary] = useState("");
  const [enrichedRows, setEnrichedRows] = useState<EnrichedExportRow[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [readyReport, setReadyReport] = useState<PaidExportCsv | null>(null);
  const [reportJobId, setReportJobId] = useState<string | null>(null);
  const [reportProgress, setReportProgress] = useState({ processed: 0, requested: 0 });
  const [isCancellingReport, setIsCancellingReport] = useState(false);
  const cancelReportRef = useRef(false);
  const pendingDriveUploadRef = useRef(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileMountKey, setTurnstileMountKey] = useState(0);
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);
  const turnstileRuntimeSnapshot = useSyncExternalStore(
    subscribeTurnstileRuntime,
    getTurnstileRuntimeSnapshot,
    () => disabledTurnstileRuntimeSnapshot
  );
  const turnstileWidgetEnabled = turnstileRuntimeSnapshot.startsWith("1:");
  const turnstileLocalhostBlocked = turnstileRuntimeSnapshot.endsWith(":1");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [reportResultLimit, setReportResultLimit] = useState<number>(
    BUSINESS_DATA_REPORT_LIMITS.default
  );
  const mapPanelRef = useRef<HTMLDivElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const resultMarkersRef = useRef<GoogleMarkerInstance[]>([]);
  const mapsConstructorsRef = useRef<GoogleMapsConstructors | null>(null);
  const activeCacheKeyRef = useRef("");
  const trackingContextRef = useRef({
    category,
    radiusMeters,
    pushToDataLayer
  });

  const selectedCategory = useMemo(
    () =>
      BUSINESS_DATA_CATEGORIES.find((item) => item.value === category)?.label ??
      category,
    [category]
  );
  const selectedRadius = useMemo(
    () => radiusOptions.find((item) => item.meters === radiusMeters) ?? radiusOptions[0],
    [radiusMeters]
  );
  const groupedCategories = useMemo(() => getGroupedCategoryOptions(), []);
  const reportLimitOptions = useMemo(
    () => getReportLimitOptions(search?.totalAvailableEstimate),
    [search?.totalAvailableEstimate]
  );
  const effectiveMaxReportLimit =
    reportLimitOptions[reportLimitOptions.length - 1] ?? BUSINESS_DATA_REPORT_LIMITS.default;
  const selectedReportLimit = clampBusinessDataReportLimit(
    reportResultLimit,
    effectiveMaxReportLimit
  );
  const selectedReportCreditCost = getBusinessDataExportTokenCost(selectedReportLimit);
  const minReportCreditCost = getBusinessDataExportTokenCost(
    reportLimitOptions[0] ?? BUSINESS_DATA_REPORT_LIMITS.min
  );
  const hasSubscriberAccess = paidAccess || (tokenBalance ?? 0) >= minReportCreditCost;
  const cachedReadyReport = useMemo(() => {
    if (!search) {
      return null;
    }

    return readReadyReportFromStorage({
      category,
      radiusMeters,
      selectedCenter,
      resultLimit: selectedReportLimit
    });
  }, [
    search,
    category,
    radiusMeters,
    selectedCenter,
    selectedReportLimit
  ]);
  const activeReport = readyReport ?? cachedReadyReport;
  const reportReady = Boolean(activeReport?.csv);
  const enrichedRowsForMap = activeReport?.rows ?? enrichedRows;
  const mapImageOnCooldown = mapImageCooldownUntil > mapCooldownTick;
  const categoryRecommendations = useMemo(
    () =>
      getCategoryRecommendations({
        category,
        locationLabel: selectedCenter.label || location
      }),
    [category, location, selectedCenter.label]
  );
  const refreshTokenBalance = useCallback(async () => {
    const balance = await fetchWalletBalance();
    if (balance !== null) {
      setTokenBalance(balance);
    }

    return balance;
  }, []);
  const consumeTurnstileToken = useCallback(() => {
    turnstileRef.current?.reset();
    setTurnstileToken("");
  }, []);
  const remountTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileMountKey((current) => current + 1);
  }, []);
  const handleTurnstileWidgetError = useCallback(() => {
    setTurnstileToken("");
  }, []);
  const handleTurnstileError = useCallback(
    (message: string) => {
      if (/timeout-or-duplicate/i.test(message)) {
        consumeTurnstileToken();
        return "Security check expired or was already used. Complete the Turnstile check again, then retry.";
      }

      return message;
    },
    [consumeTurnstileToken]
  );
  const visibleSuggestions =
    isSuggestionPanelOpen && location.trim().length >= 2 ? suggestions : [];
  const enrichedRowsByPlaceId = useMemo(
    () => new Map(enrichedRowsForMap.map((row) => [row.place_id, row])),
    [enrichedRowsForMap]
  );
  const activeMapResult = useMemo(
    () =>
      search?.results.find((result) => result.placeId === activeResultPlaceId) ??
      null,
    [activeResultPlaceId, search]
  );
  const activeMapResultNumber = useMemo(() => {
    if (!search || !activeResultPlaceId) {
      return null;
    }

    const index = search.results.findIndex((result) => result.placeId === activeResultPlaceId);
    return index >= 0 ? index + 1 : null;
  }, [activeResultPlaceId, search]);

  useEffect(() => {
    trackingContextRef.current = {
      category,
      radiusMeters,
      pushToDataLayer
    };
  }, [category, pushToDataLayer, radiusMeters]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (
        event.persisted &&
        window.location.pathname === "/business-data-generator"
      ) {
        remountTurnstile();
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [remountTurnstile]);

  useEffect(() => {
    async function loadAccount() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setIsSignedIn(Boolean(user));
      setAccountProfile(
        user
          ? {
              name:
                String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim() ||
                user.email?.split("@")[0] ||
                "Subscriber",
              email: user.email ?? "",
              avatarUrl:
                String(
                  user.user_metadata?.avatar_url ??
                    user.user_metadata?.picture ??
                    ""
                ).trim()
            }
          : null
      );
      await refreshTokenBalance();
    }

    void loadAccount();
  }, [checkoutStatus, paidAccess, refreshTokenBalance]);

  useEffect(() => {
    if (mapImageCooldownUntil <= mapCooldownTick) {
      return;
    }

    const timer = window.setInterval(() => {
      setMapCooldownTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mapImageCooldownUntil, mapCooldownTick]);

  useEffect(() => {
    if (location.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const response = await fetch(
          `/api/business-data/places?q=${encodeURIComponent(location)}`,
          { signal: controller.signal }
        );
        const json = (await response.json()) as {
          suggestions?: PlaceSuggestion[];
          error?: string;
        };

        if (response.ok) {
          setSuggestions(json.suggestions ?? []);
        }
      } catch (suggestionError) {
        if (!controller.signal.aborted) {
          console.warn("[business-data] place suggestions failed", suggestionError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [location]);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      try {
        const constructors = await loadGoogleMapsConstructors();
        if (cancelled) {
          return;
        }

        if (!constructors || !mapElementRef.current) {
          setMapError(
            browserMapKey
              ? "Google Maps could not load. You can still use the coordinate controls."
              : "Add NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY to enable the live map."
          );
          return;
        }

        mapsConstructorsRef.current = constructors;

        const map = new constructors.Map(mapElementRef.current, {
          center: { lat: selectedCenter.lat, lng: selectedCenter.lng },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        const marker = new constructors.Marker({
          position: { lat: selectedCenter.lat, lng: selectedCenter.lng },
          map,
          title: selectedCenter.label,
          icon: droppedPinIconUrl
        });

        marker.addListener("click", () => {
          setActiveResultPlaceId(null);
          setIsCenterPreviewOpen(true);
        });

        map.addListener("click", (event) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();

          if (typeof lat !== "number" || typeof lng !== "number") {
            return;
          }

          const label = `Dropped pin ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          marker.setPosition({ lat, lng });
          setActiveResultPlaceId(null);
          setIsCenterPreviewOpen(true);
          setSelectedCenter({ lat, lng, label, source: "pin" });
          setLocation(label);
          setSuggestions([]);
          trackingContextRef.current.pushToDataLayer({
            event: "business_data_pin_drop",
            page_path: "/business-data-generator",
            location_label: label,
            lat,
            lng,
            radius_meters: trackingContextRef.current.radiusMeters,
            category: trackingContextRef.current.category
          });
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
      } catch (mapSetupError) {
        if (!cancelled) {
          console.warn("[business-data] map setup failed", mapSetupError);
          setMapError(
            browserMapKey
              ? "Google Maps could not load. You can still use the coordinate controls."
              : "Add NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY to enable the live map."
          );
        }
      }
    }

    void setupMap();

    return () => {
      cancelled = true;
    };
    // The map is initialized once. Later center updates are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    const position = { lat: selectedCenter.lat, lng: selectedCenter.lng };
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(selectedCenter.source === "pin" ? 14 : 13);
    markerRef.current.setPosition(position);
  }, [selectedCenter]);

  const selectMapResult = useCallback(
    (
      result: BusinessResult,
      index: number,
      source: "marker" | "table" | "map_list"
    ) => {
      setActiveResultPlaceId(result.placeId);
      setIsCenterPreviewOpen(false);

      if (result.lat !== null && result.lng !== null) {
        const position = { lat: result.lat, lng: result.lng };
        mapRef.current?.setCenter(position);
        mapRef.current?.setZoom(16);
      }

      pushToDataLayer({
        event: "business_data_result_click",
        page_path: "/business-data-generator",
        click_target: source,
        place_id: result.placeId,
        business_name: result.name,
        result_number: index + 1,
        category,
        radius_meters: radiusMeters
      });
    },
    [category, pushToDataLayer, radiusMeters]
  );

  const showResultOnMapFromTable = (result: BusinessResult, index: number) => {
    selectMapResult(result, index, "table");

    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        mapPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  useEffect(() => {
    resultMarkersRef.current.forEach((marker) => marker.setMap(null));
    resultMarkersRef.current = [];

    if (!search?.results.length || !mapRef.current) {
      return;
    }

    const Marker = mapsConstructorsRef.current?.Marker;
    const LatLngBounds = mapsConstructorsRef.current?.LatLngBounds;
    if (!Marker) {
      return;
    }

    const bounds = LatLngBounds ? new LatLngBounds() : null;
    if (bounds) {
      bounds.extend({ lat: search.center.lat, lng: search.center.lng });
    }

    resultMarkersRef.current = search.results
      .filter((result) => result.lat !== null && result.lng !== null)
      .map((result, index) => {
        const position = { lat: result.lat as number, lng: result.lng as number };

        if (bounds) {
          bounds.extend(position);
        }

        const marker = new Marker({
          position,
          map: mapRef.current!,
          title: result.name,
          icon: getBusinessPinIconUrl(getMapPinLabel(index))
        });

        marker.addListener("click", () => selectMapResult(result, index, "marker"));
        return marker;
      });

    if (bounds && mapRef.current.fitBounds) {
      mapRef.current.fitBounds(bounds, 64);
    }
  }, [search, selectMapResult]);

  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    if (suggestion.lat === null || suggestion.lng === null) {
      return;
    }

    const label = [suggestion.label, suggestion.secondaryLabel].filter(Boolean).join(", ");
    setSelectedCenter({
      lat: suggestion.lat,
      lng: suggestion.lng,
      label,
      source: "suggestion"
    });
    setLocation(label);
    setIsSuggestionPanelOpen(false);
    setSuggestions([]);
    pushToDataLayer({
      event: "business_data_suggestion_select",
      page_path: "/business-data-generator",
      place_id: suggestion.placeId,
      place_label: suggestion.label,
      secondary_label: suggestion.secondaryLabel,
      lat: suggestion.lat,
      lng: suggestion.lng,
      category,
      radius_meters: radiusMeters
    });
  };

  const updateManualCoordinate = (field: "lat" | "lng", value: string) => {
    const coordinate = Number(value);

    if (!Number.isFinite(coordinate)) {
      return;
    }

    const nextCenter = {
      ...selectedCenter,
      [field]: coordinate,
      label: `Manual pin ${field === "lat" ? coordinate.toFixed(4) : selectedCenter.lat.toFixed(4)}, ${field === "lng" ? coordinate.toFixed(4) : selectedCenter.lng.toFixed(4)}`,
      source: "pin" as const
    };

    setSelectedCenter(nextCenter);
    setLocation(nextCenter.label);
  };

  const persistSearchSnapshot = (
    cacheKey: string,
    snapshotSearch: SearchResponse | null = search,
    snapshotPaidAccess = paidAccess
  ) => {
    const readyReportCacheKey = activeReport ? buildReportCacheKey() : undefined;

    if (activeReport && readyReportCacheKey) {
      window.localStorage.setItem(readyReportCacheKey, JSON.stringify(activeReport));
    }

    const snapshot: SearchSnapshot = {
      location,
      category,
      radiusMeters,
      selectedCenter,
      search: snapshotSearch,
      paidAccess: snapshotPaidAccess,
      reportResultLimit: selectedReportLimit,
      readyReportCacheKey,
      reportJobId: reportJobId ?? undefined,
      // eslint-disable-next-line react-hooks/purity
      savedAt: Date.now()
    };

    writeSearchSnapshot(cacheKey, snapshot);
    activeCacheKeyRef.current = cacheKey;
  };

  const runSearch = async (
    snapshot?: SearchSnapshot,
    options: { keepExisting?: boolean; paidRefresh?: boolean } = {}
  ) => {
    const searchLocation = snapshot?.location ?? location;
    const searchCategory = snapshot?.category ?? category;
    const searchRadiusMeters = snapshot?.radiusMeters ?? radiusMeters;
    const searchCenter = snapshot?.selectedCenter ?? selectedCenter;
    const canUseSelectedRadius =
      searchRadiusMeters <= freeRadiusLimitMeters ||
      snapshot?.paidAccess ||
      hasSubscriberAccess;
    const radius =
      radiusOptions.find((item) => item.meters === searchRadiusMeters) ?? radiusOptions[0];

    if (snapshot) {
      setLocation(snapshot.location);
      setCategory(snapshot.category);
      setRadiusMeters(snapshot.radiusMeters);
      setSelectedCenter(snapshot.selectedCenter);
    }

    setError("");
    if (!canUseSelectedRadius) {
      setError("Radius above 1 mile is a subscriber feature. Choose 1 mile or less, or subscribe to scan a larger area.");
      return;
    }

    if (turnstileWidgetEnabled && !turnstileToken) {
      setError("Complete the security check before searching.");
      return;
    }

    setIsLoading(true);
    if (!options.keepExisting) {
      setSearch(null);
      setActiveResultPlaceId(null);
    }
    pushToDataLayer({
      event: "business_data_search_submit",
      page_path: "/business-data-generator",
      paid_refresh: Boolean(options.paidRefresh),
      location_label: searchCenter.label,
      center_source: searchCenter.source,
      lat: searchCenter.lat,
      lng: searchCenter.lng,
      category: searchCategory,
      radius_meters: searchRadiusMeters,
      radius_miles: radius.miles
    });

    try {
      const headers = await getBusinessDataAuthHeaders();
      const response = await fetch("/api/business-data/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          location: searchLocation,
          category: searchCategory,
          radiusMeters: searchRadiusMeters,
          center: searchCenter,
          turnstileToken: turnstileToken || undefined
        })
      });
      const json = (await response.json()) as SearchResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in json && json.error ? json.error : "Search failed.");
      }

      const searchResult = json as SearchResponse;
      setSearch(searchResult);
      setActiveResultPlaceId(searchResult.results[0]?.placeId ?? null);
      setPaidAccess(Boolean(searchResult.paidAccess));
      if (typeof searchResult.tokenBalance === "number") {
        setTokenBalance(searchResult.tokenBalance);
      }
      if (activeCacheKeyRef.current) {
        writeSearchSnapshot(activeCacheKeyRef.current, {
          location: searchLocation,
          category: searchCategory,
          radiusMeters: searchRadiusMeters,
          selectedCenter: searchCenter,
          search: searchResult,
          paidAccess: Boolean(searchResult.paidAccess),
          reportResultLimit: selectedReportLimit,
          readyReportCacheKey: activeReport ? buildReportCacheKey() : undefined,
          // eslint-disable-next-line react-hooks/purity
          savedAt: Date.now()
        });
      }
      if (turnstileWidgetEnabled) {
        consumeTurnstileToken();
      }
      pushToDataLayer({
        event: "business_data_search_success",
        page_path: "/business-data-generator",
        provider: searchResult.provider,
        result_count: searchResult.results.length,
        locked_count: searchResult.lockedCount,
        total_available_estimate: searchResult.totalAvailableEstimate,
        location_label: searchResult.center.label,
        category: searchCategory,
        radius_meters: searchRadiusMeters,
        radius_miles: radius.miles
      });
    } catch (searchError) {
      const message = handleTurnstileError(
        searchError instanceof Error ? searchError.message : String(searchError)
      );
      setError(message);
      pushToDataLayer({
        event: "business_data_search_error",
        page_path: "/business-data-generator",
        error_message: message,
        location_label: searchCenter.label,
        center_source: searchCenter.source,
        category: searchCategory,
        radius_meters: searchRadiusMeters
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMapImage = async () => {
    if (!search) {
      return;
    }

    if (!isSignedIn) {
      setError("Sign in to download subscriber map images.");
      return;
    }

    if (mapImageOnCooldown) {
      setError("Map image downloads are on a short cooldown. Try again in a few seconds.");
      return;
    }

    setIsMapImageLoading(true);
    setError("");

    try {
      const cacheKey = `${mapImageCachePrefix}${makeExportCacheKey({
        category,
        radiusMeters,
        selectedCenter
      })}`;
      const response = await fetch("/api/business-data/map-image", {
        method: "POST",
        headers: {
          ...(await getBusinessDataAuthHeaders()),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          center: search.center,
          results: search.results
            .filter((result) => result.lat !== null && result.lng !== null)
            .map((result) => ({
              lat: result.lat,
              lng: result.lng,
              label: result.name
            }))
        })
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Could not download the map image from Google Static Maps.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `business-data-map-${category}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      window.localStorage.setItem(cacheKey, String(Date.now()));
      const cooldownUntil = Date.now() + MAP_IMAGE_COOLDOWN_MS;
      setMapImageCooldownUntil(cooldownUntil);
      setMapCooldownTick(Date.now());
      setExportStatus("Map image downloaded and cached for this search.");
      pushToDataLayer({
        event: "business_data_map_image_download",
        page_path: "/business-data-generator",
        result_count: search.results.length,
        category,
        radius_meters: radiusMeters
      });
    } catch (mapImageError) {
      setError(
        mapImageError instanceof Error ? mapImageError.message : String(mapImageError)
      );
    } finally {
      setIsMapImageLoading(false);
    }
  };

  const downloadPreview = () => {
    if (!search?.results.length) {
      return;
    }

    downloadCsv(previewToCsv(search.results), "business-data-preview.csv");
    pushToDataLayer({
      event: "business_data_preview_download",
      page_path: "/business-data-generator",
      result_count: search.results.length,
      paid_access: paidAccess,
      location_label: search.center.label,
      category,
      radius_meters: radiusMeters,
      radius_miles: selectedRadius.miles
    });
  };

  const buildReportCacheKey = () =>
    `${reportReadyCachePrefix}${makeExportCacheKey({
      category,
      radiusMeters,
      selectedCenter,
      resultLimit: selectedReportLimit
    })}`;

  const loadCachedReadyReport = (): PaidExportCsv | null =>
    readReadyReportFromStorage({
      category,
      radiusMeters,
      selectedCenter,
      resultLimit: selectedReportLimit
    });

  const persistReadyReport = (report: PaidExportCsv) => {
    setReadyReport(report);
    setEnrichedRows(report.rows);
    window.localStorage.setItem(buildReportCacheKey(), JSON.stringify(report));
    window.localStorage.setItem(
      `${exportCachePrefix}${makeExportCacheKey({
        category,
        radiusMeters,
        selectedCenter,
        resultLimit: selectedReportLimit
      })}`,
      report.csv
    );
    window.localStorage.setItem(
      `${exportRowsCachePrefix}${makeExportCacheKey({
        category,
        radiusMeters,
        selectedCenter,
        resultLimit: selectedReportLimit
      })}`,
      JSON.stringify(report.rows)
    );
  };

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const pollReportJob = async (jobId: string) => {
    while (true) {
      if (cancelReportRef.current) {
        await fetch("/api/business-data/report/cancel", {
          method: "POST",
          headers: await getBusinessDataAuthHeaders(),
          body: JSON.stringify({ jobId })
        });
      }

      const response = await fetch(
        `/api/business-data/report/status?id=${encodeURIComponent(jobId)}`,
        { headers: await getBusinessDataAuthHeaders() }
      );
      const json = (await response.json()) as ReportJobStatusResponse & { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not check report progress.");
      }

      setReportProgress({
        processed: json.processedCount,
        requested: json.requestedCount || json.totalPlaces
      });

      if (json.status !== "running") {
        return json;
      }

      await sleep(1500);
    }
  };

  const finalizeReportFromJob = (json: ReportJobStatusResponse) => {
    if (!json.downloadReady || !json.csv) {
      throw new Error(json.error ?? "The subscriber report did not finish successfully.");
    }

    const exportRows = json.rows ?? [];
    const rowCount = exportRows.length;
    const creditsCharged = json.creditsCharged ?? json.chargedCredits ?? rowCount;
    const filename = `business-data-export-${category}-${selectedReportLimit}-${rowCount}.xlsx`;
    const report: PaidExportCsv = {
      csv: json.csv,
      filename,
      fromCache: false,
      rows: exportRows,
      creditsCharged
    };

    if (typeof json.balance === "number") {
      setTokenBalance(json.balance);
    }

    persistReadyReport(report);

    if (json.status === "cancelled") {
      setExportSummary(
        `Report cancelled after ${rowCount} businesses. Charged ${formatCreditBalance(creditsCharged)} credits for completed work.`
      );
      setExportStatus("Partial report ready. Download Excel or send the completed rows to Google Drive.");
    } else {
      const emailsFound =
        json.emailsFound ??
        exportRows.filter((row) => String(row.email_candidates ?? "").length > 0).length;
      const pitchesGenerated =
        json.pitchesGenerated ??
        exportRows.filter((row) => String(row.recommended_pitch ?? "").length > 0).length;
      setExportSummary(
        `Report ready: ${rowCount} businesses, ${emailsFound} email candidates, ${pitchesGenerated} outreach notes. Charged ${formatCreditBalance(creditsCharged)} credits.`
      );
      setExportStatus("Report ready. Download Excel or send it to Google Drive.");
    }

    return report;
  };

  const generateReport = async () => {
    if ((tokenBalance ?? 0) < selectedReportCreditCost) {
      setError(
        `You need at least ${formatCreditBalance(selectedReportCreditCost)} credits for this ${selectedReportLimit}-business subscriber report. Subscribe or buy more credits from your profile.`
      );
      return;
    }

    if (turnstileWidgetEnabled && !turnstileToken) {
      setError("Complete the security check before generating the subscriber report.");
      return;
    }

    const cachedReport = loadCachedReadyReport();
    if (cachedReport) {
      persistReadyReport(cachedReport);
      setExportSummary(
        `Using cached report for this ${selectedReportLimit}-business search. No additional credits were charged.`
      );
      setExportStatus("Report ready. Download Excel or send it to Google Drive.");
      return;
    }

    setIsExportLoading(true);
    setExportStatus("Generating the subscriber report with website analysis and pitch recommendations...");
    setError("");
    cancelReportRef.current = false;
    setReportProgress({ processed: 0, requested: selectedReportLimit });

    try {
      const cacheKey = buildReportCacheKey();
      const startResponse = await fetch("/api/business-data/report/start", {
        method: "POST",
        headers: await getBusinessDataAuthHeaders(),
        body: JSON.stringify({
          location,
          category,
          radiusMeters,
          center: selectedCenter,
          resultLimit: selectedReportLimit,
          turnstileToken: turnstileToken || undefined,
          cacheKey
        })
      });
      const startJson = (await startResponse.json()) as ReportJobStatusResponse & {
        error?: string;
      };

      if (!startResponse.ok) {
        throw new Error(startJson.error ?? "Could not start the subscriber report.");
      }

      setReportJobId(startJson.id);
      setReportProgress({
        processed: startJson.processedCount,
        requested: startJson.requestedCount || selectedReportLimit
      });

      const finalJson =
        startJson.status === "running"
          ? await pollReportJob(startJson.id)
          : startJson;

      finalizeReportFromJob(finalJson);
      const snapshotCacheKey = activeCacheKeyRef.current || buildReportCacheKey();
      activeCacheKeyRef.current = snapshotCacheKey;
      persistSearchSnapshot(snapshotCacheKey);
      await refreshTokenBalance();

      if (turnstileWidgetEnabled) {
        consumeTurnstileToken();
      }

      pushToDataLayer({
        event: "business_data_preview_download",
        page_path: "/business-data-generator",
        export_type: "report_ready",
        paid_access: true,
        category,
        radius_meters: radiusMeters,
        radius_miles: selectedRadius.miles,
        result_count: finalJson.processedCount,
        cancelled: finalJson.status === "cancelled"
      });
    } catch (exportError) {
      setExportStatus("");
      setError(
        handleTurnstileError(
          exportError instanceof Error ? exportError.message : String(exportError)
        )
      );
    } finally {
      setIsExportLoading(false);
      setIsCancellingReport(false);
      setReportJobId(null);
      cancelReportRef.current = false;
    }
  };

  const cancelReportGeneration = async () => {
    setIsCancellingReport(true);
    cancelReportRef.current = true;

    if (!reportJobId) {
      return;
    }

    try {
      await fetch("/api/business-data/report/cancel", {
        method: "POST",
        headers: await getBusinessDataAuthHeaders(),
        body: JSON.stringify({ jobId: reportJobId })
      });
    } catch {
      // Polling loop will finalize the partial report.
    }
  };

  const downloadReadyReport = async () => {
    if (!activeReport) {
      setError("Generate the subscriber report first, then download the Excel workbook.");
      return;
    }

    setError("");
    await downloadFormattedWorkbook(activeReport.csv, activeReport.filename);
    setExportStatus("Subscriber workbook downloaded.");
    pushToDataLayer({
      event: "business_data_preview_download",
      page_path: "/business-data-generator",
      export_type: "full_paid_xlsx",
      paid_access: true,
      category,
      radius_meters: radiusMeters,
      radius_miles: selectedRadius.miles,
      result_count: activeReport.rows.length,
      cached_export: activeReport.fromCache
    });
  };

  const requestGoogleDriveAccess = async () => {
    const cacheKey = activeCacheKeyRef.current || window.crypto.randomUUID();
    const snapshot: SearchSnapshot = {
      location,
      category,
      radiusMeters,
      selectedCenter,
      search,
      paidAccess,
      reportResultLimit: selectedReportLimit,
      readyReportCacheKey: activeReport ? buildReportCacheKey() : undefined,
      reportJobId: reportJobId ?? undefined,
      pendingDriveUpload: true,
      // eslint-disable-next-line react-hooks/purity
      savedAt: Date.now()
    };

    if (activeReport && snapshot.readyReportCacheKey) {
      window.localStorage.setItem(snapshot.readyReportCacheKey, JSON.stringify(activeReport));
    }

    writeSearchSnapshot(cacheKey, snapshot);
    window.sessionStorage.setItem(driveReconnectCacheKey, cacheKey);
    window.sessionStorage.setItem(driveReconnectSnapshotKey, JSON.stringify(snapshot));
    window.localStorage.setItem(driveReconnectCacheKey, cacheKey);
    setError("");
    setExportStatus(
      "Google Drive needs permission. Choose the Google account where you want the file saved; your website account and credits will stay unchanged."
    );

    try {
      const nextPath = `/business-data-generator?drive=connected&cache=${encodeURIComponent(cacheKey)}`;
      const { error: oauthError } = await requestGoogleDriveIdentityLink(nextPath);

      if (oauthError) {
        throw oauthError;
      }

      return Boolean(await resolveGoogleDriveAccessToken());
    } catch (driveReconnectError) {
      setExportStatus("");
      setError(
        driveReconnectError instanceof Error
          ? driveReconnectError.message
          : String(driveReconnectError)
      );
      throw driveReconnectError;
    }
  };

  const uploadToGoogleDrive = async () => {
    if (!activeReport) {
      setError("Generate the subscriber report first, then send the completed workbook to Google Drive.");
      return;
    }

    setIsDriveLoading(true);
    setExportStatus("Preparing the formatted Excel workbook for your Google Drive...");
    setError("");

    let driveTab: Window | null = null;

    try {
      let providerToken = await resolveGoogleDriveAccessToken();
      if (!providerToken) {
        const connectedInline = await requestGoogleDriveAccess();
        providerToken = await resolveGoogleDriveAccessToken();
        if (!connectedInline || !providerToken) {
          return;
        }
      }

      const exportFile = activeReport;
      driveTab = window.open("about:blank", "_blank");
      if (driveTab) {
        driveTab.opener = null;
        driveTab.document.title = "Opening Google Drive...";
        driveTab.document.body.innerHTML =
          "<p style=\"font-family: system-ui, sans-serif; padding: 24px;\">Uploading your formatted Excel workbook to Google Drive...</p>";
      }

      const workbookBlob = await makeFormattedWorkbookBlob(exportFile.csv);
      const uploadJson = await uploadCsvWorkbookToGoogleDrive({
        csv: exportFile.csv,
        filename: exportFile.filename,
        workbookBlob
      });

      if (uploadJson.webViewLink) {
        if (driveTab) {
          driveTab.location.href = uploadJson.webViewLink;
        } else {
          window.open(uploadJson.webViewLink, "_blank", "noopener,noreferrer");
        }
      } else {
        driveTab?.close();
      }

      await refreshTokenBalance();
      setExportStatus(
        uploadJson.webViewLink
          ? `Uploaded ${uploadJson.name ?? exportFile.filename} to Google Drive and opened it in a new tab.`
          : `Uploaded ${uploadJson.name ?? exportFile.filename} to your Google Drive.`
      );
      pushToDataLayer({
        event: "business_data_preview_download",
        page_path: "/business-data-generator",
        export_type: "google_drive_upload",
        paid_access: true,
        category,
        radius_meters: radiusMeters,
        radius_miles: selectedRadius.miles,
        cached_export: exportFile.fromCache,
        drive_file_id: uploadJson.id
      });
    } catch (driveError) {
      driveTab?.close();
      const driveMessage =
        driveError instanceof Error ? driveError.message : String(driveError);

      if (driveMessage === "GOOGLE_DRIVE_AUTH_REQUIRED") {
        clearGoogleDriveAccessToken();
        const connectedInline = await requestGoogleDriveAccess();
        if (connectedInline) {
          await uploadToGoogleDrive();
        }
        return;
      }
      setExportStatus("");
      setError(
        handleTurnstileError(
          driveError instanceof Error ? driveError.message : String(driveError)
        )
      );
    } finally {
      setIsDriveLoading(false);
    }
  };

  useEffect(() => {
    if (!pendingDriveUploadRef.current || !activeReport || isDriveLoading) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const providerToken = await resolveGoogleDriveAccessToken();

      if (cancelled) {
        return;
      }

      if (!providerToken) {
        pendingDriveUploadRef.current = false;
        setExportStatus("");
        setError(
          "Google Drive access was not granted. Click Export to Drive again to connect Google and finish the upload."
        );
        return;
      }

      pendingDriveUploadRef.current = false;
      await uploadToGoogleDrive();
    })();

    return () => {
      cancelled = true;
    };
  }, [activeReport, exportStatus, isDriveLoading]);

  const requestCheckout = async (bundleId: BusinessDataCreditBundleId = "starter") => {
    setError("");
    setCheckoutStatus("");

    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setPendingCheckoutBundle(bundleId);
      return;
    }

    const cacheKey = activeCacheKeyRef.current || window.crypto.randomUUID();
    persistSearchSnapshot(cacheKey);
    const nextPath = `/business-data-generator?checkoutBundle=${encodeURIComponent(
      bundleId
    )}&cache=${encodeURIComponent(cacheKey)}`;
    const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
    window.location.href = loginPath;
  };

  const startCheckout = async (bundleId: BusinessDataCreditBundleId = "starter") => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      await requestCheckout(bundleId);
      return;
    }

    const cacheKey = activeCacheKeyRef.current || window.crypto.randomUUID();
    persistSearchSnapshot(cacheKey);
    setIsCheckoutLoading(true);
    setError("");
    setCheckoutStatus("Saving your current results before Stripe opens...");
    pushToDataLayer({
      event: "business_data_checkout_click",
      page_path: "/business-data-generator",
      location_label: selectedCenter.label,
      center_source: selectedCenter.source,
      category,
      radius_meters: radiusMeters,
      radius_miles: selectedRadius.miles,
      result_count: search?.results.length ?? 0,
      locked_count: search?.lockedCount ?? 0
    });

    try {
      const response = await fetch("/api/business-data/checkout", {
        method: "POST",
        headers: await getBusinessDataAuthHeaders(),
        body: JSON.stringify({
          location,
          category,
          radiusMeters,
          center: selectedCenter,
          cacheKey,
          bundleId,
          product: "business-data-export"
        })
      });
      const json = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Stripe checkout is not configured yet.");
      }

      // eslint-disable-next-line react-hooks/immutability
      window.location.href = json.url;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : String(checkoutError);
      setError(message);
      pushToDataLayer({
        event: "business_data_checkout_error",
        page_path: "/business-data-generator",
        error_message: message,
        category,
        radius_meters: radiusMeters
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const restoreReportFromJob = async (
    jobId: string,
    snapshot: Pick<
      SearchSnapshot,
      "category" | "radiusMeters" | "selectedCenter" | "reportResultLimit" | "readyReportCacheKey"
    >
  ) => {
    const response = await fetch(`/api/business-data/reports/${encodeURIComponent(jobId)}`, {
      headers: await getBusinessDataAuthHeaders()
    });
    const json = (await response.json()) as {
      csv?: string;
      rows?: EnrichedExportRow[];
      filename?: string;
      creditsCharged?: number;
      chargedCredits?: number;
      error?: string;
    };

    if (!response.ok || !json.csv) {
      throw new Error(json.error ?? "Could not restore your saved report.");
    }

    const exportRows = json.rows ?? [];
    const limit = snapshot.reportResultLimit ?? BUSINESS_DATA_REPORT_LIMITS.default;
    const report: PaidExportCsv = {
      csv: json.csv,
      filename:
        json.filename ??
        `business-data-export-${snapshot.category}-${limit}-${exportRows.length}.xlsx`,
      fromCache: true,
      rows: exportRows,
      creditsCharged: json.creditsCharged ?? json.chargedCredits
    };
    const cacheKey =
      snapshot.readyReportCacheKey ??
      `${reportReadyCachePrefix}${makeExportCacheKey({
        category: snapshot.category,
        radiusMeters: snapshot.radiusMeters,
        selectedCenter: snapshot.selectedCenter,
        resultLimit: limit
      })}`;

    setReadyReport(report);
    setEnrichedRows(report.rows);
    window.localStorage.setItem(cacheKey, JSON.stringify(report));
    return report;
  };

  const restoreSearchState = useCallback(
    (
      cachedSearch: SearchSnapshot,
      status: string,
      statusTarget: "checkout" | "export"
    ) => {
      setLocation(cachedSearch.location);
      setCategory(cachedSearch.category);
      setRadiusMeters(cachedSearch.radiusMeters);
      setSelectedCenter(cachedSearch.selectedCenter);
      setSearch(cachedSearch.search);
      setActiveResultPlaceId(cachedSearch.search?.results[0]?.placeId ?? null);
      setPaidAccess(cachedSearch.paidAccess);
      if (cachedSearch.reportResultLimit) {
        setReportResultLimit(cachedSearch.reportResultLimit);
      }
      if (cachedSearch.reportJobId) {
        setReportJobId(cachedSearch.reportJobId);
      }

      const restoredReport = readReadyReportByCacheKey(cachedSearch.readyReportCacheKey ?? null);
      if (restoredReport) {
        setReadyReport(restoredReport);
        setEnrichedRows(restoredReport.rows);
      } else if (cachedSearch.reportJobId) {
        void restoreReportFromJob(cachedSearch.reportJobId, cachedSearch).catch(() => {
          setError("Your search was restored, but the completed report could not be reloaded.");
        });
      }

      pendingDriveUploadRef.current = Boolean(cachedSearch.pendingDriveUpload);

      if (statusTarget === "checkout") {
        setCheckoutStatus(status);
      } else {
        setExportStatus(status);
      }
    },
    []
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const checkoutBundle = params.get("checkoutBundle");
    const driveReconnectCache =
      params.get("drive") === "connected"
        ? params.get("cache")
        : window.sessionStorage.getItem(driveReconnectCacheKey) ??
          window.localStorage.getItem(driveReconnectCacheKey);
    let restoreTimer: number | undefined;

    const scheduleRestore = (
      cachedSearch: SearchSnapshot,
      status: string,
      statusTarget: "checkout" | "export"
    ) => {
      restoreTimer = window.setTimeout(() => {
        restoreSearchState(cachedSearch, status, statusTarget);
      }, 0);
    };

    if (!checkout) {
      if (isCreditBundleId(checkoutBundle)) {
        const cacheKey = params.get("cache") || window.localStorage.getItem(lastSearchCacheKey);
        const cachedSearch = readSearchSnapshot(cacheKey);

        if (cacheKey) {
          activeCacheKeyRef.current = cacheKey;
        }

        if (cachedSearch) {
          scheduleRestore(
            cachedSearch,
            "Signed in. Review your selected package to continue to Stripe.",
            "checkout"
          );
        } else {
          setCheckoutStatus("Signed in. Review your selected package to continue to Stripe.");
        }

        setPendingCheckoutBundle(checkoutBundle);
        remountTurnstile();
        window.history.replaceState({}, "", "/business-data-generator");

        return () => {
          if (restoreTimer) {
            window.clearTimeout(restoreTimer);
          }
        };
      }

      if (driveReconnectCache) {
        const cachedSearch =
          readSearchSnapshot(driveReconnectCache) ?? readDriveReconnectSnapshot();
        window.sessionStorage.removeItem(driveReconnectCacheKey);
        window.sessionStorage.removeItem(driveReconnectSnapshotKey);
        window.localStorage.removeItem(driveReconnectCacheKey);

        if (cachedSearch) {
          activeCacheKeyRef.current = driveReconnectCache;
          scheduleRestore(
            cachedSearch,
            cachedSearch.pendingDriveUpload
              ? "Google Drive access updated. Resuming your export..."
              : "Google Drive access updated. Your search was restored, so you can send the export to Drive now.",
            "export"
          );
          remountTurnstile();
          window.history.replaceState({}, "", "/business-data-generator");
        }
      }

      return () => {
        if (restoreTimer) {
          window.clearTimeout(restoreTimer);
        }
      };
    }

    const cacheKey = params.get("cache") || window.localStorage.getItem(lastSearchCacheKey);
    const cachedSearch = readSearchSnapshot(cacheKey);

    if (cacheKey) {
      activeCacheKeyRef.current = cacheKey;
    }

    if (cachedSearch) {
      scheduleRestore(cachedSearch, "Restored the search you had before checkout.", "checkout");
      remountTurnstile();
    }

    if (checkout === "cancelled") {
      const cancelTimer = window.setTimeout(() => {
        remountTurnstile();
        setCheckoutStatus(
          "Checkout was cancelled. Your previous search was restored. Complete the security check below before searching again."
        );
        window.history.replaceState({}, "", "/business-data-generator");
      }, 0);

      return () => {
        if (restoreTimer) {
          window.clearTimeout(restoreTimer);
        }
        window.clearTimeout(cancelTimer);
      };
    }

    const sessionId = params.get("session_id");

    if (checkout !== "success" || !sessionId) {
      return;
    }
    const verifiedSessionId = sessionId;

    let cancelled = false;

    async function verifyCheckout() {
      setCheckoutStatus("Verifying your Stripe payment...");
      try {
        const response = await fetch(
          `/api/business-data/checkout/verify?session_id=${encodeURIComponent(verifiedSessionId)}`
        );
        const json = (await response.json()) as {
          paid?: boolean;
          error?: string;
          tokensGranted?: number;
        };

        if (!response.ok || !json.paid) {
          throw new Error(json.error ?? "Stripe payment could not be verified.");
        }

        if (cancelled) {
          return;
        }

        setPaidAccess(true);
        if (json.tokensGranted) {
          setTokenBalance((current) => (current ?? 0) + json.tokensGranted!);
        } else {
          const balance = await fetchWalletBalance();
          if (balance !== null) {
            setTokenBalance(balance);
          }
        }
        setCheckoutStatus(
          `Payment verified. ${formatCreditBalance(json.tokensGranted ?? SUBSCRIPTION_CREDIT_GRANT)} credits added to your account.`
        );

        if (cachedSearch) {
          await runSearch(
            { ...cachedSearch, paidAccess: true },
            { keepExisting: true, paidRefresh: true }
          );
        }

        if (!cancelled) {
          setCheckoutStatus("Subscriber tools unlocked. Use your credits to generate formatted Excel reports.");
          window.history.replaceState({}, "", "/business-data-generator");
        }
      } catch (verifyError) {
        if (!cancelled) {
          setCheckoutStatus("");
          setError(
            verifyError instanceof Error ? verifyError.message : String(verifyError)
          );
        }
      }
    }

    void verifyCheckout();

    return () => {
      cancelled = true;
      if (restoreTimer) {
        window.clearTimeout(restoreTimer);
      }
    };
    // This effect is only for handling the Stripe return URL once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      {isExportLoading || isDriveLoading ? (
        <ExportLoadingOverlay
          category={category}
          location={location || selectedCenter.label}
          title={
            isDriveLoading
              ? "Uploading your export to Google Drive..."
              : "Generating your subscriber Excel report..."
          }
          subtitle={
            isDriveLoading
              ? "Please keep this page open while the completed workbook uploads to Google Drive."
              : "You can cancel anytime. Credits are charged only for businesses already processed."
          }
          resultCount={search?.totalAvailableEstimate ?? search?.results.length ?? 0}
          processedCount={reportProgress.processed}
          requestedCount={reportProgress.requested || selectedReportLimit}
          cancellable={isExportLoading && !isDriveLoading}
          onCancel={() => void cancelReportGeneration()}
          isCancelling={isCancellingReport}
        />
      ) : null}
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[430px_minmax(0,1fr)]">
          <div className="relative z-10 border-b border-stone-200 bg-gradient-to-b from-white via-stone-50 to-emerald-50/60 p-5 text-stone-950 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Local market finder
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Start with a place. See the businesses around it.
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Search a business, city, neighborhood, or address. We will use that point
              as the center of the map and build a nearby business preview.
            </p>

            <div className="mt-6 space-y-4">
              <label className="relative block text-sm font-semibold text-stone-800">
                <span className="mb-2 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                    1
                  </span>
                  <span>Where should we look?</span>
                </span>
                <input
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setIsSuggestionPanelOpen(true);
                  }}
                  onFocus={() => setIsSuggestionPanelOpen(true)}
                  onBlur={() => window.setTimeout(() => setIsSuggestionPanelOpen(false), 120)}
                  placeholder="Museum of the Future, Dubai"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-950 shadow-sm outline-none ring-emerald-200 transition placeholder:text-stone-400 focus:border-emerald-300 focus:ring-4"
                />
                {(visibleSuggestions.length > 0 || isSuggesting) && (
                  <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-stone-200 bg-white p-2 text-stone-950 shadow-2xl">
                    {isSuggesting ? (
                      <p className="px-3 py-2 text-xs font-semibold text-stone-500">
                        Checking Google Maps...
                      </p>
                    ) : null}
                    {visibleSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        disabled={suggestion.lat === null || suggestion.lng === null}
                        className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="block text-sm font-black">
                          {suggestion.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-stone-500">
                          {suggestion.secondaryLabel || "Google Maps result"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </label>

              <label className="block text-sm font-semibold text-stone-800">
                <span className="mb-2 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                    2
                  </span>
                  <span>What type of business?</span>
                </span>
                <select
                  value={category}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    setCategory(nextCategory);
                    pushToDataLayer({
                      event: "business_data_category_change",
                      page_path: "/business-data-generator",
                      category: nextCategory,
                      previous_category: category,
                      location_label: selectedCenter.label
                    });
                  }}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-950 shadow-sm outline-none ring-emerald-200 transition focus:border-emerald-300 focus:ring-4"
                >
                  {groupedCategories.map((group) => (
                    <optgroup key={group.id} label={group.label}>
                      {group.options.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              {categoryRecommendations.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                    Recommended categories
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categoryRecommendations.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setCategory(item.value)}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="block text-sm font-semibold text-stone-800">
                <span className="mb-2 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                    3
                  </span>
                  <span>How far from the pin?</span>
                </span>
                <select
                  value={radiusMeters}
                  onChange={(event) => {
                    const nextRadius = Number(event.target.value);
                    const radius = radiusOptions.find(
                      (item) => item.meters === nextRadius
                    );

                    if (nextRadius > freeRadiusLimitMeters && !hasSubscriberAccess) {
                      setError("Radius above 1 mile is for subscribers. Choose 1 mile or less, or subscribe to unlock a wider scan.");
                      return;
                    }

                    setRadiusMeters(nextRadius);
                    setError("");
                    pushToDataLayer({
                      event: "business_data_radius_change",
                      page_path: "/business-data-generator",
                      radius_meters: nextRadius,
                      radius_miles: radius?.miles ?? null,
                      previous_radius_meters: radiusMeters,
                      category,
                      location_label: selectedCenter.label
                    });
                  }}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-950 shadow-sm outline-none ring-emerald-200 transition focus:border-emerald-300 focus:ring-4"
                >
                  {radiusOptions.map((item) => (
                    <option
                      key={item.meters}
                      value={item.meters}
                      disabled={item.meters > freeRadiusLimitMeters && !hasSubscriberAccess}
                    >
                      {item.label}
                      {item.meters > freeRadiusLimitMeters && !hasSubscriberAccess
                        ? " - subscribers"
                        : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs leading-5 text-stone-500">
                  Free previews scan up to 1 mile. Subscribers can scan up to 5 miles.
                </span>
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-900 shadow-sm">
              {accountProfile ? (
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-stone-50 p-3">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 bg-cover bg-center text-sm font-black uppercase text-emerald-800 ring-1 ring-emerald-200"
                    style={
                      accountProfile.avatarUrl
                        ? { backgroundImage: `url(${accountProfile.avatarUrl})` }
                        : undefined
                    }
                    aria-label={`${accountProfile.name} profile picture`}
                  >
                    {accountProfile.avatarUrl
                      ? null
                      : accountProfile.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{accountProfile.name}</p>
                    <p className="truncate text-xs text-stone-500">{accountProfile.email}</p>
                  </div>
                </div>
              ) : null}
              <p className="font-bold">Credit balance: {formatCreditBalance(tokenBalance)}</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {isSignedIn
                  ? `Process ${formatCreditBalance(selectedReportLimit)} businesses = ${formatCreditBalance(selectedReportLimit)} credits. Plans start at $${BUSINESS_DATA_CREDIT_BUNDLES.starter.priceUsd} for ${formatCreditBalance(BUSINESS_DATA_CREDIT_BUNDLES.starter.credits)} credits.`
                  : "Sign in before checkout so credits attach to your account."}
              </p>
              {!isSignedIn ? (
                <Link
                  href="/login?next=/business-data-generator"
                  className="mt-3 inline-flex rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:bg-stone-800"
                >
                  Sign in
                </Link>
              ) : null}
            </div>

            {turnstileWidgetEnabled || turnstileLocalhostBlocked ? (
              <div
                id="security-check"
                className="relative z-30 mt-4 overflow-visible rounded-2xl border border-stone-200 bg-white p-4 text-stone-900"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                  Security check
                </p>
                {turnstileWidgetEnabled ? (
                  <>
                    <TurnstileWidget
                      key={turnstileMountKey}
                      ref={turnstileRef}
                      onToken={setTurnstileToken}
                      onError={handleTurnstileWidgetError}
                    />
                    {!turnstileToken ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        Complete the security check before running another search.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-stone-600">
                    {getTurnstileLocalhostDevMessage()}
                  </p>
                )}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Latitude
                <input
                  value={selectedCenter.lat}
                  onChange={(event) => updateManualCoordinate("lat", event.target.value)}
                  className="mt-2 min-h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-950 shadow-sm outline-none ring-emerald-200 transition focus:border-emerald-300 focus:ring-4"
                />
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                Longitude
                <input
                  value={selectedCenter.lng}
                  onChange={(event) => updateManualCoordinate("lng", event.target.value)}
                  className="mt-2 min-h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-950 shadow-sm outline-none ring-emerald-200 transition focus:border-emerald-300 focus:ring-4"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => runSearch()}
              disabled={isLoading}
              className="mt-6 min-h-12 w-full rounded-full bg-stone-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md disabled:cursor-wait disabled:translate-y-0 disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] text-stone-950">
                    4
                  </span>
                  Looking nearby...
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] text-stone-950">
                    4
                  </span>
                  Find nearby businesses
                </span>
              )}
            </button>

            {checkoutStatus ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                <p>{checkoutStatus}</p>
                {turnstileWidgetEnabled && !turnstileToken ? (
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("security-check")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 underline"
                  >
                    Go to security check
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setCheckoutStatus("")}
                  className="mt-2 block text-xs font-bold text-emerald-700 underline"
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <div
            ref={mapPanelRef}
            className="relative min-h-[720px] overflow-hidden bg-stone-900 xl:min-h-[820px]"
          >
            <div ref={mapElementRef} className="absolute inset-0" />
            {!mapReady ? (
              <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.24),transparent_30%),linear-gradient(135deg,#0f172a,#1c1917)]">
                <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:42px_42px]" />
                <div className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-emerald-400 text-3xl font-black text-stone-950 shadow-[0_0_0_14px_rgba(16,185,129,0.16)]">
                  PIN
                </div>
                <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
                  <p className="text-sm font-bold">
                    {mapError || "Loading interactive map..."}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">
                    You can still search Google suggestions or edit latitude and
                    longitude manually. Once the browser map key is added, users can
                    click the map to drop a pin.
                  </p>
                </div>
              </div>
            ) : null}
            {mapReady && search?.results.length ? (
              <div className="pointer-events-auto absolute bottom-5 left-5 top-20 z-10 hidden w-[280px] flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/95 text-stone-900 shadow-2xl backdrop-blur lg:flex">
                <div className="border-b border-stone-200 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">
                    Map results
                  </p>
                  <p className="mt-1 text-sm font-black text-ink">
                    Click a business to show its pin
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {search.results.map((result, index) => {
                    const isActiveResult = activeResultPlaceId === result.placeId;
                    const mapPinLabel = getMapPinLabel(index);

                    return (
                      <button
                        key={`map-list-${result.placeId}`}
                        type="button"
                        onClick={() => selectMapResult(result, index, "map_list")}
                        className={`block w-full rounded-2xl p-3 text-left transition ${
                          isActiveResult
                            ? "bg-red-50 ring-2 ring-inset ring-red-200"
                            : "hover:bg-stone-100"
                        }`}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-black text-white ${
                              isActiveResult ? "bg-red-600" : "bg-stone-950"
                            }`}
                          >
                            {mapPinLabel}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-ink">
                              {result.name}
                            </span>
                            <span className="mt-1 block truncate text-xs font-semibold text-stone-500">
                              {result.rating ? `${result.rating.toFixed(1)} rating` : formatStatus(result.openNow)}
                              {result.reviewCount ? ` · ${result.reviewCount} reviews` : ""}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {mapReady && (activeMapResult || isCenterPreviewOpen) ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(calc(100%-2rem),360px)] -translate-x-1/2 -translate-y-[calc(100%+4rem)] lg:left-[calc(50%+5rem)] lg:w-[360px] lg:translate-x-0 lg:-translate-y-1/2">
                <div className="pointer-events-auto relative rounded-3xl border border-white/30 bg-white/95 p-4 text-stone-900 shadow-2xl ring-1 ring-stone-950/5 backdrop-blur">
                <span
                  aria-hidden="true"
                  className="absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-white/30 bg-white/95 lg:block"
                />
                <span
                  aria-hidden="true"
                  className="absolute -left-20 top-1/2 hidden w-20 -translate-y-1/2 border-t-2 border-dotted border-stone-950/70 lg:block"
                />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-16 left-1/2 h-16 -translate-x-1/2 border-l-2 border-dotted border-stone-950/70 lg:hidden"
                />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[4.35rem] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-stone-950 shadow-[0_0_0_4px_rgba(255,255,255,0.8)] lg:hidden"
                />
                <div className="flex items-start gap-3">
                  <span className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-black text-white ${
                    activeMapResult ? "bg-red-600" : "bg-stone-950"
                  }`}>
                    {activeMapResult ? (activeMapResultNumber ?? "") : "PIN"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">
                      {activeMapResult ? activeMapResult.name : selectedCenter.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-600">
                      {activeMapResult
                        ? activeMapResult.address
                        : `${selectedCenter.lat.toFixed(5)}, ${selectedCenter.lng.toFixed(5)}`}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-stone-500">
                      {activeMapResult
                        ? `${activeMapResult.phone || "Phone unavailable"}${
                            activeMapResult.rating
                              ? ` · ${activeMapResult.rating.toFixed(1)} rating`
                              : ""
                          }`
                        : "This is the center point used for the nearby business search."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      {(activeMapResult?.mapsUrl || !activeMapResult) ? (
                        <a
                          href={
                            activeMapResult?.mapsUrl ??
                            `https://www.google.com/maps/search/?api=1&query=${selectedCenter.lat},${selectedCenter.lng}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-stone-950 px-3 py-1.5 text-white"
                        >
                          Open Maps
                        </a>
                      ) : null}
                      {activeMapResult?.website ? (
                        <a
                          href={activeMapResult.website}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-stone-300 px-3 py-1.5 text-ink"
                        >
                          Website
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveResultPlaceId(null);
                          setIsCenterPreviewOpen(false);
                        }}
                        className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-600"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                      <p className="text-xs font-bold leading-5 text-emerald-950">
                        Want more businesses, website checks, and outreach-ready notes?
                      </p>
                      {hasSubscriberAccess ? (
                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                          Generate the paid report below to enrich every selected business.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("business-data-credit-bundles")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" })
                          }
                          className="mt-2 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-800"
                        >
                          See paid credit bundles
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="min-h-[520px] rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        {isLoading ? <LoadingMascot label="Scanning nearby businesses..." /> : null}
        {!isLoading && search ? (
          <div className="space-y-5">
            <div className="grid gap-4 rounded-[1.5rem] bg-stone-950 p-5 text-white sm:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">
                  {hasSubscriberAccess ? "Subscriber report unlocked" : "Preview results"}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {selectedCategory} near {search.center.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {hasSubscriberAccess
                      ? `Showing ${search.results.length} preview records. Subscriber reports add public email candidates, website checks, and outreach notes for each exported business.`
                    : `Showing ${search.results.length} free records. Full reports unlock wider scans, a business counter, and a formatted Excel workbook with email discovery, website checks, and outreach notes.`}
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
                  {hasSubscriberAccess ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                        Business counter
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {search.totalAvailableEstimate === 1
                          ? "1 business found"
                          : `About ${search.totalAvailableEstimate} businesses found`}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-stone-300">
                        The workbook can include the subscriber export limit for this scan.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                        Subscriber feature
                      </p>
                      <p className="mt-2 text-sm font-semibold text-stone-300">
                        Unlock the full business counter for this area.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
                <p className="font-semibold">Search center</p>
                <p className="mt-2 text-stone-300">
                  {search.center.lat.toFixed(4)}, {search.center.lng.toFixed(4)}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${search.center.lat},${search.center.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    pushToDataLayer({
                      event: "business_data_result_click",
                      page_path: "/business-data-generator",
                      click_target: "search_center_map",
                      location_label: search.center.label,
                      category,
                      radius_meters: radiusMeters
                    })
                  }
                  className="mt-3 inline-flex font-bold text-emerald-200 underline"
                >
                  Open map
                </a>
              </div>
            </div>

            {hasSubscriberAccess ? (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
                <label className="block text-sm font-black text-ink">
                  Businesses to process in the report
                  <select
                    value={selectedReportLimit}
                    onChange={(event) => setReportResultLimit(Number(event.target.value))}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4 sm:max-w-xs"
                  >
                    {reportLimitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === search.totalAvailableEstimate
                          ? `All found (${formatBusinessCount(option)})`
                          : formatBusinessCount(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
                  Process {formatBusinessCount(selectedReportLimit)} ={" "}
                  {formatCreditBalance(selectedReportCreditCost)} credits. Each business gets details,
                  website checks, and outreach notes.
                </p>
              </div>
            ) : (
              <div
                id="business-data-credit-bundles"
                className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                      What full access unlocks
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-ink">
                      Turn this 3-business preview into a sales-ready lead workbook.
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                      The free preview proves the area and category. Full access lets you scan up to
                      5 miles, process up to 60 businesses per report, download a map image, enrich
                      each row, and export the finished workbook to Google Drive.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-black text-emerald-800">
                      Plans start at ${BUSINESS_DATA_CREDIT_BUNDLES.starter.priceUsd}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-stone-600">
                      1 credit processes 1 business. Credits work across multiple reports, and
                      cancelled reports only charge completed rows.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-4">
                  {creditBundleOptions.map((bundle) => (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => void requestCheckout(bundle.id)}
                      disabled={isCheckoutLoading}
                      className="rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                        {bundle.name}
                      </p>
                      <p className="mt-2 text-2xl font-black text-ink">
                        ${bundle.priceUsd}
                      </p>
                      <p className="mt-1 text-sm font-black text-emerald-800">
                        {formatCreditBalance(bundle.credits)} credits
                      </p>
                      <p className="mt-2 text-xs leading-5 text-stone-600">
                        {bundle.description}
                      </p>
                      <SupportedPaymentMethods compact />
                    </button>
                  ))}
                  <Link
                    href="/contact?source=business-data-sales"
                    className="rounded-2xl border border-stone-200 bg-stone-950 p-4 text-left text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                      Contact Sales
                    </p>
                    <p className="mt-2 text-2xl font-black">Custom</p>
                    <p className="mt-1 text-sm font-black text-emerald-200">
                      Bulk credits
                    </p>
                    <p className="mt-2 text-xs leading-5 text-stone-300">
                      For teams, large campaigns, or custom enrichment needs.
                    </p>
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {subscriptionShowcaseItems.map((item) => (
                    <div
                      key={item.title}
                      tabIndex={0}
                      className="rounded-2xl border border-stone-200 bg-white p-4 text-sm shadow-sm outline-none transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl focus-visible:-translate-y-1 focus-visible:border-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-100"
                    >
                      <p className="font-black text-ink">{item.title}</p>
                      <p className="mt-2 leading-6 text-stone-600">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadPreview}
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-stone-100"
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">📄</span>
                  Download preview CSV
                </span>
              </button>
              {hasSubscriberAccess ? (
                <>
                  {!reportReady ? (
                    <button
                      type="button"
                      onClick={() => void generateReport()}
                      disabled={isExportLoading}
                      className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-300"
                    >
                      {isExportLoading
                        ? "Building the report..."
                        : `Generate ${selectedReportLimit}-business report`}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void downloadReadyReport()}
                        className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden="true">📊</span>
                          Download Excel
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void uploadToGoogleDrive()}
                        disabled={isDriveLoading}
                        title="Uploads the formatted Excel workbook to the Google Drive account used for sign-in."
                        className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-stone-100 disabled:cursor-wait disabled:bg-stone-100 disabled:text-stone-400"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden="true">☁️</span>
                          {isDriveLoading ? "Uploading to Drive..." : "Send to my Google Drive"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.localStorage.removeItem(buildReportCacheKey());
                          setReadyReport(null);
                          setEnrichedRows([]);
                          setExportSummary("");
                          setExportStatus("");
                        }}
                        className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-stone-100"
                      >
                        Generate again
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => void downloadMapImage()}
                    disabled={isMapImageLoading || mapImageOnCooldown || !isSignedIn}
                    className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-stone-100 disabled:cursor-wait disabled:bg-stone-100 disabled:text-stone-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">🖼️</span>
                      {isMapImageLoading
                        ? "Preparing map image..."
                        : mapImageOnCooldown
                          ? "Map cooldown active..."
                          : "Download map image"}
                    </span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void requestCheckout("starter")}
                  disabled={isCheckoutLoading}
                  className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-300"
                >
                  {isCheckoutLoading ? "Opening Stripe..." : "Get the full lead report"}
                </button>
              )}
            </div>

            {exportSummary ? (
              <p className="rounded-2xl bg-stone-100 p-3 text-sm font-semibold text-stone-800">
                {exportSummary}
              </p>
            ) : null}

            {exportStatus ? (
              <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {exportStatus}
              </p>
            ) : null}

            <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">
                    Business results
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-700">
                    Select any row to highlight its map pin and preview details.
                  </p>
                </div>
                <span className="rounded-full bg-stone-950 px-3 py-1.5 text-xs font-black text-white">
                  {search.results.length} shown
                </span>
              </div>
              <div className="max-h-[760px] overflow-auto">
                <table className="min-w-[920px] border-separate border-spacing-0 text-sm">
                  <thead className="sticky top-0 z-10 bg-white/95 text-left text-xs uppercase tracking-wide text-stone-500 shadow-sm backdrop-blur">
                    <tr>
                      <th className="px-4 py-3">Business</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Actions</th>
                      {enrichedRows.length > 0 ? (
                        <th className="px-4 py-3">Website notes and outreach angle</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {search.results.map((result, index) => {
                      const enriched = enrichedRowsByPlaceId.get(result.placeId);
                      const mapPinLabel = getMapPinLabel(index);
                      const isActiveResult = activeResultPlaceId === result.placeId;

                      return (
                      <tr
                        id={`business-result-${result.placeId}`}
                        key={result.placeId}
                        onClick={() => selectMapResult(result, index, "table")}
                        className={`group cursor-pointer align-top transition ${
                          isActiveResult
                            ? "bg-red-50/80 ring-2 ring-inset ring-red-200"
                            : "hover:bg-stone-50"
                        }`}
                      >
                        <td className={`border-l-4 px-4 py-4 ${
                          isActiveResult ? "border-red-500" : "border-transparent"
                        }`}>
                          <div className="flex max-w-sm items-start gap-3">
                            <span className={`mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-black text-white shadow-sm ${
                              isActiveResult ? "bg-red-600" : "bg-stone-950"
                            }`}>
                              {mapPinLabel}
                            </span>
                            <div className="min-w-0">
                              <p className="font-black leading-5 text-ink">{result.name}</p>
                              <p className="mt-1 max-w-xs text-xs leading-5 text-stone-500">
                                {result.address}
                              </p>
                            </div>
                          </div>
                          <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                            result.openNow === true
                              ? "bg-emerald-50 text-emerald-700"
                              : result.openNow === false
                                ? "bg-amber-50 text-amber-700"
                                : "bg-stone-100 text-stone-600"
                          }`}>
                            {formatStatus(result.openNow)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          <p className="font-semibold text-ink">{result.phone || "Phone unavailable"}</p>
                          <p className="mt-1 max-w-[240px] truncate text-xs text-stone-500">
                            {result.website || "No website found"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {result.rating ? (
                            <div className="rounded-2xl bg-stone-50 p-3">
                              <p className="text-lg font-black text-ink">{result.rating.toFixed(1)}</p>
                              <p className="text-xs font-semibold text-stone-500">
                                {result.reviewCount ?? 0} reviews
                              </p>
                            </div>
                          ) : (
                            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-500">
                              No rating
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2 text-xs font-black">
                            {result.lat !== null && result.lng !== null ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  showResultOnMapFromTable(result, index);
                                }}
                                className="inline-flex justify-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-800 transition hover:bg-red-100"
                              >
                                Show pin {mapPinLabel}
                              </button>
                            ) : null}
                            {result.mapsUrl ? (
                              <a
                                href={result.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  pushToDataLayer({
                                    event: "business_data_result_click",
                                    page_path: "/business-data-generator",
                                    click_target: "result_maps",
                                    place_id: result.placeId,
                                    business_name: result.name,
                                    category,
                                    radius_meters: radiusMeters
                                  });
                                }}
                                className="inline-flex justify-center rounded-full bg-stone-950 px-3 py-1.5 text-white transition hover:bg-stone-800"
                              >
                                Maps
                              </a>
                            ) : null}
                            {result.website ? (
                              <a
                                href={result.website}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  pushToDataLayer({
                                    event: "business_data_result_click",
                                    page_path: "/business-data-generator",
                                    click_target: "result_website",
                                    place_id: result.placeId,
                                    business_name: result.name,
                                    domain: safeHostname(result.website),
                                    category,
                                    radius_meters: radiusMeters
                                  });
                                }}
                                className="inline-flex justify-center rounded-full border border-stone-300 px-3 py-1.5 text-ink transition hover:bg-stone-100"
                              >
                                Website
                              </a>
                            ) : null}
                          </div>
                        </td>
                        {enrichedRows.length > 0 ? (
                          <td className="px-4 py-4">
                            {enriched ? (
                              <div className="max-w-md space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs leading-5 text-stone-700">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                  {enriched.pitch_angle || "Outreach angle"}
                                </p>
                                <p className="whitespace-pre-line">
                                  <span className="font-bold text-ink">Analysis:</span>{" "}
                                  {enriched.website_analysis}
                                </p>
                                <p className="whitespace-pre-line">
                                  <span className="font-bold text-ink">Opportunity:</span>{" "}
                                  {enriched.business_opportunity_summary}
                                </p>
                                <p className="whitespace-pre-line rounded-xl bg-white p-3 font-medium text-stone-800 shadow-sm">
                                  {enriched.recommended_pitch}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400">
                                Generate the subscriber report to add website notes for this business.
                              </p>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : !isLoading ? (
          <div className="flex min-h-[480px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <div className="relative h-28 w-28">
              <Image
                src="/assistant-mascot-body.svg"
                alt="Business data mascot"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="mt-6 text-2xl font-black text-ink">
              Choose a point on the map, then scan the market around it.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-600">
              Use Google suggestions for real businesses and addresses, or drop a
              pin to search around exact latitude and longitude coordinates.
            </p>
            <div className="mt-6 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
              {["Source lookup", "Map pin radius", "Clean export data"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold text-stone-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContactForm source="business_data_generator" />
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
            Need help?
          </p>
          <h2 className="mt-3 text-2xl font-black text-ink">
            Questions about exports, credits, or Google Drive delivery
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Use the form to ask about billing, category selection, enrichment fields,
            or anything that looks off in your export.
          </p>
          <ul className="mt-5 space-y-2 text-sm font-semibold text-stone-700">
            <li>Subscriber report: 1 credit per processed business</li>
            <li>Google Drive upload: included after report generation</li>
            <li>Starter: {formatCreditBalance(BUSINESS_DATA_CREDIT_BUNDLES.starter.credits)} credits for ${BUSINESS_DATA_CREDIT_BUNDLES.starter.priceUsd}</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Pin-point targeting",
            copy: "Use a Google result or map click as the center point for the pull."
          },
          {
            title: "Mile-based radius",
            copy: "Free previews scan up to 1 mile. Subscribers can widen the area up to 5 miles."
          },
          {
            title: "Subscriber enrichment path",
            copy: "Subscriber reports add public email candidates, website checks, and outreach-ready notes."
          }
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-black text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.copy}</p>
          </div>
        ))}
      </section>

      {pendingCheckoutBundle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-confirm-title"
            className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Continue to payment
            </p>
            <h2
              id="checkout-confirm-title"
              className="mt-3 text-2xl font-black tracking-tight text-ink"
            >
              {BUSINESS_DATA_CREDIT_BUNDLES[pendingCheckoutBundle].name} plan
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              You&apos;ll be taken to Stripe to complete payment. Use the back button here,
              cancel on Stripe, or your browser back button to return to your search.
            </p>
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-2xl font-black text-ink">
                ${BUSINESS_DATA_CREDIT_BUNDLES[pendingCheckoutBundle].priceUsd}
              </p>
              <p className="mt-1 text-sm font-black text-emerald-800">
                {formatCreditBalance(
                  BUSINESS_DATA_CREDIT_BUNDLES[pendingCheckoutBundle].credits
                )}{" "}
                credits
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {BUSINESS_DATA_CREDIT_BUNDLES[pendingCheckoutBundle].description}
              </p>
              <SupportedPaymentMethods />
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingCheckoutBundle(null)}
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-stone-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const bundleId = pendingCheckoutBundle;
                  setPendingCheckoutBundle(null);
                  void startCheckout(bundleId);
                }}
                disabled={isCheckoutLoading}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-300"
              >
                {isCheckoutLoading ? "Opening Stripe..." : "Pay securely with Stripe"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
