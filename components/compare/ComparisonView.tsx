import Link from "next/link";

import { ToolCard } from "@/components/tools/ToolCard";
import type { ComparisonPage } from "@/lib/comparisons";
import { FREE_TOOLS } from "@/lib/free-tools";
import { getRelatedComparisonLinks } from "@/lib/seo-pinned-internal-links";
import {
  getReferralLinkForProduct,
  isExternalReferralUrl,
  type ReferralLink
} from "@/lib/referral-links";

type ComparisonViewProps = {
  comparison: ComparisonPage;
};

export function ComparisonView({ comparison }: ComparisonViewProps) {
  const relatedTools = FREE_TOOLS.filter((tool) =>
    comparison.relatedToolHrefs.includes(tool.href)
  );
  const relatedComparisons = getRelatedComparisonLinks(
    comparison.relatedComparisonHrefs
  );
  const faqItems =
    comparison.faqQuestions?.length
      ? comparison.faqQuestions
      : null;
  const referralLinks = [
    getReferralLinkForProduct(comparison.productA),
    getReferralLinkForProduct(comparison.productB)
  ].filter((referral): referral is ReferralLink => Boolean(referral));

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          Comparison guide
        </p>
        <h2 className="mt-3 text-2xl font-black text-ink">
          {comparison.productA} vs {comparison.productB}: which one should you choose?
        </h2>
        {comparison.quickAnswer ? (
          <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-800">
              Quick answer
            </p>
            <p className="mt-2 text-base leading-8 text-stone-800">
              {comparison.quickAnswer}
            </p>
          </div>
        ) : null}
        <div className="mt-4 space-y-4 text-base leading-8 text-stone-700">
          <p>
            This {comparison.productA} vs {comparison.productB} comparison is
            written for operators, publishers, founders, and small teams that
            need a practical software decision, not a generic feature list.
            The right choice depends on workflow, cost sensitivity, technical
            control, growth goals, and how quickly the tool helps you publish,
            sell, report, or monetize.
          </p>
          <p>{comparison.summary}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-[1fr_auto_1fr]">
          <ProductPanel
            name={comparison.productA}
            label="Option A"
            items={comparison.bestForA}
            accent="from-indigo-600 to-sky-500"
          />
          <div className="flex items-center justify-center border-y border-stone-200 bg-stone-950 px-6 py-5 text-center text-2xl font-black uppercase tracking-[0.22em] text-white md:border-x md:border-y-0">
            VS
          </div>
          <ProductPanel
            name={comparison.productB}
            label="Option B"
            items={comparison.bestForB}
            accent="from-amber-500 to-rose-500"
          />
        </div>
        <div className="border-t border-stone-200 bg-stone-50 p-6">
          <p className="text-base leading-8 text-stone-700">
            {comparison.summary}
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <TextDecisionPanel
          title={`Choose ${comparison.productA} if...`}
          product={comparison.productA}
          items={comparison.bestForA}
        />
        <TextDecisionPanel
          title={`Choose ${comparison.productB} if...`}
          product={comparison.productB}
          items={comparison.bestForB}
        />
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              Decision map
            </p>
            <h2 className="mt-2 text-2xl font-black text-ink">
              Quick decision table
            </h2>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            {comparison.decisionRows.length} factors
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {comparison.decisionRows.map((row, index) => (
            <DecisionCard
              key={row.label}
              row={row}
              productA={comparison.productA}
              productB={comparison.productB}
              index={index}
            />
          ))}
        </div>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-4 py-3">Factor</th>
                <th className="px-4 py-3">{comparison.productA}</th>
                <th className="px-4 py-3">{comparison.productB}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.decisionRows.map((row) => (
                <tr key={row.label} className="border-t border-stone-200">
                  <th className="px-4 py-3 font-semibold text-ink">{row.label}</th>
                  <td className="px-4 py-3 text-stone-700">{row.left}</td>
                  <td className="px-4 py-3 text-stone-700">{row.right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          Buying guide
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">
          How to evaluate {comparison.productA} and {comparison.productB}
        </h2>
        <div className="mt-5 space-y-5">
          {comparison.decisionRows.map((row) => (
            <div key={row.label}>
              <h3 className="text-lg font-black text-ink">{row.label}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-700">
                For {row.label.toLowerCase()}, {comparison.productA} is best
                described as <strong>{row.left}</strong>, while{" "}
                {comparison.productB} is best described as{" "}
                <strong>{row.right}</strong>. Use this factor to decide which
                product better matches your current budget, team size, content
                workflow, and revenue goals.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-amber-200/60 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
            Revenue lens
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Monetization angle
          </h2>
        </div>
        <p className="mt-3 text-sm leading-7 text-stone-700">
          {comparison.monetizationAngle}
        </p>
      </section>

      {referralLinks.length > 0 ? (
        <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Referral options
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Try the tools from this comparison
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-700">
            Some links may be referral links. They can support Tech Revenue
            Brief, but you should still compare the current pricing, terms, and
            product fit before signing up.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {referralLinks.map((referral) => (
              <a
                key={referral.product}
                href={referral.href}
                target={
                  isExternalReferralUrl(referral.href) ? "_blank" : undefined
                }
                rel={
                  isExternalReferralUrl(referral.href)
                    ? "sponsored nofollow noopener noreferrer"
                    : undefined
                }
                className="group rounded-3xl border border-stone-900 bg-stone-950 p-5 text-white shadow-xl shadow-stone-950/15 transition hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-2xl"
              >
                <span className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-emerald-200">
                  Referral link
                </span>
                <span className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink transition group-hover:bg-emerald-50">
                  Open {referral.product}
                  <span aria-hidden="true">{"->"}</span>
                </span>
                <span className="mt-3 block text-xs leading-5 text-stone-300">
                  {referral.disclosure}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {relatedComparisons.length > 0 ? (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
            Related comparisons
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Compare similar tools next
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedComparisons.map((related) => (
              <Link
                key={related.slug}
                href={`/compare/${related.slug}`}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-stone-400"
              >
                <p className="font-bold text-ink">{related.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {related.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {relatedTools.length > 0 ? (
        <section>
          <h2 className="text-2xl font-black text-ink">Related free tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedTools.map((tool) => (
              <ToolCard key={tool.href} tool={tool} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          Search questions
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">
          Common questions about {comparison.productA} vs {comparison.productB}
        </h2>
        <div className="mt-5 space-y-5">
          {faqItems
            ? faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-black text-ink">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    {item.answer}
                  </p>
                </div>
              ))
            : (
            <>
          <div>
            <h3 className="text-lg font-black text-ink">
              Is {comparison.productA} better than {comparison.productB}?
            </h3>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              {comparison.productA} is better for teams that match these needs:{" "}
              {formatSentenceList(comparison.bestForA)}. {comparison.productB}
              is better when your priorities are{" "}
              {formatSentenceList(comparison.bestForB)}.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-black text-ink">
              What is the main difference between {comparison.productA} and{" "}
              {comparison.productB}?
            </h3>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              The main difference is how each product fits into the operating
              model. {comparison.productA} tends to fit teams looking for{" "}
              {comparison.bestForA[0]?.toLowerCase() ?? "one workflow"}, while{" "}
              {comparison.productB} tends to fit teams looking for{" "}
              {comparison.bestForB[0]?.toLowerCase() ?? "another workflow"}.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-black text-ink">
              Which keywords does this comparison cover?
            </h3>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              This guide covers searches such as{" "}
              {formatSentenceList(comparison.keywords)} and related software
              comparison questions for publishers, creators, SaaS teams, and
              operators.
            </p>
          </div>
            </>
            )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <p className="text-sm leading-7 text-stone-700">
          Explore more side-by-side guides on the{" "}
          <Link href="/compare" className="font-semibold text-ink underline">
            comparisons hub
          </Link>
          , browse{" "}
          <Link href="/tools" className="font-semibold text-ink underline">
            free tools
          </Link>
          , or request a{" "}
          <Link href="/monetization-audit" className="font-semibold text-ink underline">
            free monetization audit
          </Link>{" "}
          for your site.
        </p>
      </section>
    </div>
  );
}

function formatSentenceList(items: string[]) {
  if (items.length === 0) {
    return "a specific workflow fit";
  }

  if (items.length === 1) {
    return items[0].toLowerCase();
  }

  const normalized = items.map((item) => item.toLowerCase());
  const last = normalized.at(-1);
  const firstItems = normalized.slice(0, -1);

  return `${firstItems.join(", ")}, and ${last}`;
}

function TextDecisionPanel({
  title,
  product,
  items
}: {
  title: string;
  product: string;
  items: string[];
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <p key={item} className="text-sm leading-7 text-stone-700">
            <strong className="text-ink">{product}</strong> makes sense for{" "}
            {item.toLowerCase()}. This matters because the best software choice
            is usually the one that removes friction from your current workflow
            before it adds more dashboards, setup, or monthly cost.
          </p>
        ))}
      </div>
    </section>
  );
}

function ProductPanel({
  name,
  label,
  items,
  accent
}: {
  name: string;
  label: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className={`relative min-h-72 overflow-hidden bg-gradient-to-br ${accent} p-6 text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.16)_50%,rgba(255,255,255,0.16)_75%,transparent_75%,transparent)] bg-[length:100%_100%,30px_30px]" />
      <div className="relative">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] backdrop-blur">
          {label}
        </span>
        <h2 className="mt-6 text-4xl font-black tracking-tight">{name}</h2>
        <div className="mt-6 space-y-3">
          {items.slice(0, 3).map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white/18 p-3 text-sm font-semibold leading-6 shadow-sm backdrop-blur"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({
  row,
  productA,
  productB,
  index
}: {
  row: ComparisonPage["decisionRows"][number];
  productA: string;
  productB: string;
  index: number;
}) {
  const widths = [88, 72, 62, 80];
  const leftWidth = widths[index % widths.length];
  const rightWidth = widths[(index + 2) % widths.length];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-black text-ink">{row.label}</h3>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
          Compare
        </span>
      </div>
      <div className="mt-5 space-y-4">
        <VisualBar label={productA} value={row.left} width={leftWidth} color="bg-indigo-500" />
        <VisualBar label={productB} value={row.right} width={rightWidth} color="bg-amber-500" />
      </div>
    </div>
  );
}

function VisualBar({
  label,
  value,
  width,
  color
}: {
  label: string;
  value: string;
  width: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
        <span>{label}</span>
        <span className="normal-case tracking-normal text-stone-600">{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
