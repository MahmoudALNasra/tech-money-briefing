"use client";

import Link from "next/link";

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

function NextActions() {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
        Next actions
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/content-brief-generator"
          className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-700"
        >
          Content brief
        </Link>
        <Link
          href="/blog-title-generator"
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-ink transition hover:border-ink"
        >
          Titles
        </Link>
        <Link
          href="/meta-description-generator"
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-ink transition hover:border-ink"
        >
          Meta descriptions
        </Link>
      </div>
    </div>
  );
}

export function KeywordClusterResults({ result }: { result: KeywordClusterResult }) {
  const analysis = result.analysis ?? {};

  return (
    <div className="space-y-5">
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

      <NextActions />
    </div>
  );
}

export function SerpIntentResults({ result }: { result: SerpIntentResult }) {
  const analysis = result.analysis ?? {};

  if (result.needsSerper) {
    return (
      <div className="space-y-5">
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
        <NextActions />
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      <NextActions />
    </div>
  );
}

export function ContentGapResults({ result }: { result: ContentGapResult }) {
  const analysis = result.analysis ?? {};

  return (
    <div className="space-y-5">
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

      <NextActions />
    </div>
  );
}
