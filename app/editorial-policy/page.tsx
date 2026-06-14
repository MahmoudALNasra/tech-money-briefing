import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "Learn how Tech Revenue Brief discovers topics, uses AI assistance, handles corrections, and separates advertising."
};

export default function EditorialPolicyPage() {
  return (
    <InfoPage
      eyebrow="Editorial Policy"
      title="Editorial Policy"
      description="How we discover topics, write original briefings, and review tech monetization content."
    >
      <h2>Our Scope</h2>
      <p>
        We monitor public feeds, trends, search demand, and product updates from
        technology, online business, marketing, ecommerce, fintech, startup, and
        creator economy sources.
      </p>
      <p>
        Coverage is selected for relevance to the Tech Revenue Brief thesis:
        how technology affects revenue, distribution, operations, and online
        business opportunities.
      </p>
      <h2>Use of AI</h2>
      <p>
        AI assistance may be used to organize drafts, research angles, identify
        monetization implications, and produce concise takeaways. Feeds and
        outside articles are used mainly for topic discovery, not for copying
        article structure or wording.
      </p>
      <p>
        AI-generated summaries are structured to add analysis, context, and
        practical implications rather than duplicate source wording. The system
        is designed to skip off-topic content when it does not fit the
        publication scope.
      </p>
      <h2>Human Review</h2>
      <p>
        Briefings are reviewed for originality, topical fit, readable structure,
        and practical usefulness before publication. Pages that are
        off-topic, overly thin, duplicated, or low-value are not published.
      </p>
      <p>
        We also maintain original tools, comparison pages, and editorial guides
        that provide standalone value beyond automated summaries.
      </p>
      <h2>Topic Discovery and Attribution</h2>
      <p>
        Articles should fit the site thesis: helping readers understand how
        technology affects revenue, distribution, operations, and online
        business opportunities.
      </p>
      <p>
        When an article relies on a specific quote, statistic, official claim,
        or source-only fact, we may cite or link to the relevant source. When a
        feed only helps us notice a topic, the finished article is written as an
        original Tech Revenue Brief editorial piece.
      </p>
      <h2>Corrections</h2>
      <p>
        To request a correction, contact{" "}
        <a href="mailto:hello@techrevenuebrief.com">
          hello@techrevenuebrief.com
        </a>
        .
      </p>
      <p>
        Correction requests should include the article URL, the issue, and any
        supporting source material. We may update, clarify, or remove content
        when warranted.
      </p>
      <h2>Advertising Separation</h2>
      <p>
        Sponsored placements and partner messages should be relevant to readers
        and may be labeled. Advertising relationships do not require positive
        editorial coverage.
      </p>
    </InfoPage>
  );
}
