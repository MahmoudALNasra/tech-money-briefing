import Link from "next/link";

import { EDITORIAL_TOPICS, editorialSourceUrl } from "@/data/editorial-topics";
import { getPublishedArticleBySourceUrl } from "@/lib/articles";
import { COMPARISONS } from "@/lib/comparisons";
import { formatCategory } from "@/lib/format";
import { getToolPageSeo } from "@/lib/tool-pages";

type ToolSeoSectionsProps = {
  toolHref: string;
};

export async function ToolSeoSections({ toolHref }: ToolSeoSectionsProps) {
  const seo = getToolPageSeo(toolHref);

  if (!seo) {
    return null;
  }

  const comparisons = (seo.relatedComparisonSlugs ?? [])
    .map((slug) => COMPARISONS.find((c) => c.slug === slug))
    .filter((c): c is (typeof COMPARISONS)[number] => Boolean(c));

  const companionTopics = (seo.editorialTopicIds ?? [])
    .map((id) => EDITORIAL_TOPICS.find((topic) => topic.id === id))
    .filter((topic): topic is (typeof EDITORIAL_TOPICS)[number] => Boolean(topic));
  const companionGuides = await Promise.all(
    companionTopics.map(async (topic) => {
      const article = await getPublishedArticleBySourceUrl(
        editorialSourceUrl(topic.id)
      );

      return { topic, article };
    })
  );

  return (
    <div className="mt-14 space-y-10 border-t border-stone-200 pt-12">
      <section className="scroll-mt-24" id="what-it-solves">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
          Problem
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">What this tool solves</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
          {seo.problem}
        </p>
      </section>

      <section className="scroll-mt-24" id="how-to-use">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          How to use
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">Step-by-step</h2>
        <ol className="mt-5 space-y-4">
          {seo.howToSteps.map((step, index) => (
            <li
              key={step}
              className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-black text-white">
                {index + 1}
              </span>
              <span className="pt-1 text-sm leading-7 text-stone-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="scroll-mt-24" id="workflows">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          Workflows
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">Best workflows</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {seo.workflows.map((workflow) => (
            <div
              key={workflow}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-semibold leading-6 text-stone-700"
            >
              {workflow}
            </div>
          ))}
        </div>
      </section>

      {companionTopics.length > 0 ? (
        <section className="scroll-mt-24" id="guides">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
            Learn more
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">Companion guides</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Continue with related guides when available, or browse the matching
            topic category for more live briefings.
          </p>
          <ul className="mt-4 space-y-2">
            {companionGuides.map(({ topic, article }) => (
              <li key={topic.id}>
                <Link
                  href={
                    article
                      ? `/${article.category}/${article.slug}`
                      : `/${topic.category}`
                  }
                  className="text-sm font-semibold text-ink underline decoration-stone-300 underline-offset-4 hover:decoration-ink"
                >
                  {topic.title}
                </Link>
                {!article ? (
                  <span className="ml-2 text-xs font-semibold text-stone-500">
                    Browse {formatCategory(topic.category)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {comparisons.length > 0 ? (
        <section className="scroll-mt-24" id="comparisons">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
            Software picks
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">Related comparisons</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {comparisons.map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ink hover:shadow-sm"
              >
                {comparison.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="scroll-mt-24" id="faq">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
          FAQ
        </p>
        <h2 className="mt-2 text-2xl font-black text-ink">Common questions</h2>
        <div className="mt-5 space-y-3">
          {seo.faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm open:shadow-md"
            >
              <summary className="cursor-pointer list-none font-bold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="text-stone-400 transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-stone-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
