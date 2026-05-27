import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "Learn how Tech Revenue Brief sources articles, uses AI assistance, preserves attribution, handles corrections, and separates advertising."
};

export default function EditorialPolicyPage() {
  return (
    <InfoPage
      eyebrow="Editorial Policy"
      title="Editorial Policy"
      description="How we source, summarize, and review tech monetization briefings."
    >
      <h2>Our Scope</h2>
      <p>
        We monitor public RSS feeds from technology, online business,
        marketing, ecommerce, fintech, startup, and creator economy sources.
      </p>
      <p>
        Coverage is selected for relevance to the Tech Revenue Brief thesis:
        how technology affects revenue, distribution, operations, and online
        business opportunities.
      </p>
      <h2>Use of AI</h2>
      <p>
        AI assistance is used to summarize source material, identify
        monetization implications, and produce concise takeaways. We preserve
        source attribution and avoid presenting source claims as original
        reporting.
      </p>
      <p>
        AI-generated summaries are structured to add analysis, context, and
        practical implications rather than duplicate source wording. The system
        is designed to skip off-topic content when it does not fit the
        publication scope.
      </p>
      <h2>Source Attribution</h2>
      <p>
        Articles should fit the site thesis: helping readers understand how
        technology affects revenue, distribution, operations, and online
        business opportunities.
      </p>
      <p>
        Each briefing identifies the original source. Readers should visit the
        original source for full context, quotes, images, and complete reporting.
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
