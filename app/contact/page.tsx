import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Tech Revenue Brief for feedback, corrections, and partnership questions."
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="Contact"
      description="Reach out with corrections, source suggestions, partnership questions, or editorial feedback."
    >
      <p>
        For now, contact the team by email at{" "}
        <a href="mailto:hello@techrevenuebrief.com">
          hello@techrevenuebrief.com
        </a>
        .
      </p>
      <p>
        If you are submitting a correction, please include the article URL and
        the specific passage you want reviewed.
      </p>
      <h2>Corrections</h2>
      <p>
        We review correction requests for factual accuracy, attribution issues,
        broken links, outdated source references, and unclear summaries. Please
        include enough context for us to verify the issue quickly.
      </p>
      <h2>Source Suggestions</h2>
      <p>
        If you know a high-quality RSS feed about AI tools, SEO, ecommerce,
        digital marketing, startups, fintech, or creator business, send it to us
        with a short note explaining why it fits the Tech Revenue Brief audience.
      </p>
      <h2>Advertising and Partnerships</h2>
      <p>
        For sponsorships, partner placements, or media questions, contact{" "}
        <a href="mailto:ads@techrevenuebrief.com">
          ads@techrevenuebrief.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
