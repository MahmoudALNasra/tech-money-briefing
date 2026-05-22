import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "Editorial policy for Tech Revenue Brief."
};

export default function EditorialPolicyPage() {
  return (
    <InfoPage
      eyebrow="Editorial Policy"
      title="Editorial Policy"
      description="How we source, summarize, and review tech monetization briefings."
    >
      <p>
        We monitor public RSS feeds from technology, online business,
        marketing, ecommerce, fintech, startup, and creator economy sources.
      </p>
      <p>
        AI assistance is used to summarize source material, identify
        monetization implications, and produce concise takeaways. We preserve
        source attribution and avoid presenting source claims as original
        reporting.
      </p>
      <p>
        Articles should fit the site thesis: helping readers understand how
        technology affects revenue, distribution, operations, and online
        business opportunities.
      </p>
      <p>
        To request a correction, contact{" "}
        <a href="mailto:hello@techrevenuebrief.com">
          hello@techrevenuebrief.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
