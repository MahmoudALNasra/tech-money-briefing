"use client";

import Link from "next/link";

import { useDataLayer } from "@/hooks/useDataLayer";

type KeywordClusterResult = {
  provider?: string;
  plan?: {
    primary?: string;
    variants?: string[];
    longTail?: string[];
    faqQueries?: string[];
    intentNotes?: string[];
  };
  autocomplete?: string[];
  analysis?: {
    summary?: string;
    clusters?: Array<{
      name?: string;
      intent?: string;
      keywords?: string[];
      pageType?: string;
      opportunity?: string;
    }>;
    quickWins?: string[];
    pagePlan?: Array<{ page?: string; keywords?: string[]; angle?: string }>;
  };
};

type SerpIntentResult = {
  provider?: string;
  needsSerper?: boolean;
  serp?: Array<{
    title?: string;
    url?: string;
    domain?: string;
    description?: string;
    rank?: number | null;
  }>;
  relatedSearches?: string[];
  peopleAlsoAsk?: Array<{ question?: string; snippet?: string }>;
  analysis?: {
    summary?: string;
    intent?: string;
    dominantPageTypes?: string[];
    contentGaps?: string[];
    recommendedOutline?: string[];
    titleIdeas?: string[];
    recommendedIntent?: string;
  };
};

type ContentGapResult = {
  provider?: string;
  fetched?: { yourPageChars?: number; competitorPageChars?: number[] };
  analysis?: {
    summary?: string;
    missingSections?: string[];
    weakSections?: string[];
    faqGaps?: string[];
    recommendedEdits?: string[];
    priorityFixes?: string[];
  };
};

type ExportRow = {
  section: string;
  field: string;
  value: string;
};

type ExportToolbarProps = {
  result: unknown;
  tool: "keyword-cluster" | "serp-intent" | "content-gap";
  keyword: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : String(item)
      )
      .join("; ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function rowsFromValue(value: unknown, section = "result", field = ""): ExportRow[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      rowsFromValue(item, section, field ? `${field}.${index + 1}` : String(index + 1))
    );
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      const nextSection = field ? section : key;
      const nextField = field ? `${field}.${key}` : key;
      return rowsFromValue(child, nextSection, nextField);
    });
  }

  return [
    {
      section,
      field,
      value: stringifyCell(value)
    }
  ];
}

function toCsv(rows: ExportRow[]) {
  const headers = ["section", "field", "value"];
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCell(row[header as keyof ExportRow])).join(",")
    )
  ].join("\r\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ExportToolbar({ result, tool, keyword }: ExportToolbarProps) {
  const pushToDataLayer = useDataLayer();
  const rows = rowsFromValue(result);
  const filenameBase = `${tool}-${slugify(keyword || "analysis")}`;

  function trackDownload(format: "csv" | "xlsx") {
    pushToDataLayer({
      event: "advanced_tool_download",
      advanced_tool: tool,
      download_format: format,
      keyword,
      rows: rows.length
    });
  }

  function downloadCsv() {
    trackDownload("csv");
    downloadBlob(
      new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }),
      `${filenameBase}.csv`
    );
  }

  async function downloadXlsx() {
    trackDownload("xlsx");
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis");
    XLSX.writeFile(workbook, `${filenameBase}.xlsx`, { compression: true });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
          Export analysis
        </p>
        <p className="mt-1 text-sm text-stone-600">
          Download the generated result for planning, sharing, or a client brief.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-ink transition hover:border-ink"
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={() => void downloadXlsx()}
          className="rounded-full bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700"
        >
          Download XLSX
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  accent = "border-stone-200"
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${accent}`}>
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-stone-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NextActions({ tool, keyword }: { tool: string; keyword: string }) {
  const pushToDataLayer = useDataLayer();
  const links = [
    { href: "/content-brief-generator", label: "Content brief" },
    { href: "/blog-title-generator", label: "Titles" },
    { href: "/meta-description-generator", label: "Meta descriptions" }
  ];

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
        Next actions
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              index === 0
                ? "rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-700"
                : "rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-ink transition hover:border-ink"
            }
            onClick={() =>
              pushToDataLayer({
                event: "advanced_tool_next_action_click",
                advanced_tool: tool,
                keyword,
                destination_href: link.href,
                destination_label: link.label
              })
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function KeywordClusterResults({
  result,
  keyword
}: {
  result: KeywordClusterResult;
  keyword: string;
}) {
  const analysis = result.analysis ?? {};

  return (
    <div className="space-y-5">
      <ExportToolbar result={result} tool="keyword-cluster" keyword={keyword} />
      {analysis.summary ? (
        <SectionCard title="Summary" accent="border-emerald-200 bg-emerald-50/30">
          <p className="text-sm leading-7 text-stone-700">{analysis.summary}</p>
        </SectionCard>
      ) : null}

      {result.plan ? (
        <SectionCard title="Keyword plan">
          <div className="flex flex-wrap gap-2">
            {[
              result.plan.primary,
              ...(result.plan.variants ?? []).slice(0, 8),
              ...(result.plan.longTail ?? []).slice(0, 4)
            ]
              .filter(Boolean)
              .map((kw) => (
                <span
                  key={String(kw)}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700"
                >
                  {kw}
                </span>
              ))}
          </div>
        </SectionCard>
      ) : null}

      {analysis.clusters?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {analysis.clusters.map((cluster, index) => (
            <div
              key={cluster.name ?? index}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-black text-ink">{cluster.name ?? `Cluster ${index + 1}`}</h3>
                {cluster.opportunity ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase text-amber-900">
                    {cluster.opportunity}
                  </span>
                ) : null}
              </div>
              {cluster.intent ? (
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                  {cluster.intent}
                </p>
              ) : null}
              {cluster.pageType ? (
                <p className="mt-2 text-sm text-stone-600">Page type: {cluster.pageType}</p>
              ) : null}
              {cluster.keywords?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cluster.keywords.slice(0, 8).map((kw) => (
                    <span
                      key={kw}
                      className="rounded-lg bg-stone-50 px-2 py-1 text-xs text-stone-600"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {analysis.quickWins?.length ? (
        <SectionCard title="Quick wins">
          <ListItems items={analysis.quickWins} />
        </SectionCard>
      ) : null}

      <NextActions tool="keyword-cluster" keyword={keyword} />
    </div>
  );
}

export function SerpIntentResults({
  result,
  keyword
}: {
  result: SerpIntentResult;
  keyword: string;
}) {
  const analysis = result.analysis ?? {};

  if (result.needsSerper) {
    return (
      <div className="space-y-5">
        <ExportToolbar result={result} tool="serp-intent" keyword={keyword} />
        <SectionCard title="Serper required" accent="border-amber-200 bg-amber-50/50">
          <p className="text-sm leading-7 text-stone-700">
            {analysis.summary ??
              "Add SERPER_API_KEY to unlock live Google SERP analysis."}
          </p>
          {analysis.recommendedIntent ? (
            <p className="mt-3 text-sm font-semibold text-ink">
              {analysis.recommendedIntent}
            </p>
          ) : null}
        </SectionCard>
        <NextActions tool="serp-intent" keyword={keyword} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ExportToolbar result={result} tool="serp-intent" keyword={keyword} />
      {analysis.intent ? (
        <SectionCard title="Search intent" accent="border-indigo-200 bg-indigo-50/30">
          <p className="text-lg font-black text-ink">{analysis.intent}</p>
        </SectionCard>
      ) : null}

      {analysis.dominantPageTypes?.length ? (
        <SectionCard title="Dominant page types">
          <ListItems items={analysis.dominantPageTypes} />
        </SectionCard>
      ) : null}

      {analysis.contentGaps?.length ? (
        <SectionCard title="Content gaps">
          <ListItems items={analysis.contentGaps} />
        </SectionCard>
      ) : null}

      {analysis.recommendedOutline?.length ? (
        <SectionCard title="Recommended outline">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-stone-700">
            {analysis.recommendedOutline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </SectionCard>
      ) : null}

      {analysis.titleIdeas?.length ? (
        <SectionCard title="Title ideas">
          <ListItems items={analysis.titleIdeas} />
        </SectionCard>
      ) : null}

      {result.serp?.length ? (
        <SectionCard title="Top organic results">
          <div className="space-y-3">
            {result.serp.slice(0, 6).map((row) => (
              <div
                key={row.url ?? row.title}
                className="rounded-xl border border-stone-100 bg-stone-50 p-3"
              >
                <p className="text-xs font-bold text-stone-400">
                  #{row.rank ?? "—"} {row.domain}
                </p>
                <p className="mt-1 font-semibold text-ink">{row.title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-600">{row.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {result.peopleAlsoAsk?.length ? (
        <SectionCard title="People also ask">
          <ListItems
            items={result.peopleAlsoAsk.map((p) => p.question ?? "").filter(Boolean)}
          />
        </SectionCard>
      ) : null}

      <NextActions tool="serp-intent" keyword={keyword} />
    </div>
  );
}

export function ContentGapResults({
  result,
  keyword
}: {
  result: ContentGapResult;
  keyword: string;
}) {
  const analysis = result.analysis ?? {};
  const pushToDataLayer = useDataLayer();

  return (
    <div className="space-y-5">
      <ExportToolbar result={result} tool="content-gap" keyword={keyword} />
      {analysis.summary ? (
        <SectionCard title="Summary" accent="border-orange-200 bg-orange-50/30">
          <p className="text-sm leading-7 text-stone-700">{analysis.summary}</p>
        </SectionCard>
      ) : null}

      {analysis.priorityFixes?.length ? (
        <SectionCard title="Priority fixes">
          <ListItems items={analysis.priorityFixes} />
        </SectionCard>
      ) : null}

      {analysis.missingSections?.length ? (
        <SectionCard title="Missing sections">
          <ListItems items={analysis.missingSections} />
        </SectionCard>
      ) : null}

      {analysis.faqGaps?.length ? (
        <SectionCard title="FAQ gaps">
          <ListItems items={analysis.faqGaps} />
          <Link
            href="/faq-generator"
            className="mt-4 inline-flex text-sm font-bold text-ink underline"
            onClick={() =>
              pushToDataLayer({
                event: "advanced_tool_next_action_click",
                advanced_tool: "content-gap",
                keyword,
                destination_href: "/faq-generator",
                destination_label: "Generate FAQ ideas"
              })
            }
          >
            Generate FAQ ideas
          </Link>
        </SectionCard>
      ) : null}

      {analysis.recommendedEdits?.length ? (
        <SectionCard title="Recommended edits">
          <ListItems items={analysis.recommendedEdits} />
        </SectionCard>
      ) : null}

      <NextActions tool="content-gap" keyword={keyword} />
    </div>
  );
}
