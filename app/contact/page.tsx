import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { ContactForm } from "@/components/contact/ContactForm";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata = buildPageMetadata({
  title: "Contact",
  description: "Contact Tech Revenue Brief for corrections, source suggestions, sponsorship questions, referral guide feedback, and editorial partnerships.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="Contact Tech Revenue Brief"
      description="Ask for help, send a correction, suggest a source, or talk sponsorships. Messages go to sales@techrevenuebrief.com and are saved for follow-up."
    >
      <p>
        Use the form below when you cannot find the right tool, article, or next
        step. The assistant may send users here when a question needs human
        context instead of another automated answer.
      </p>
      <ContactForm />
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
        For sponsorships, partner placements, media questions, or strategy help,
        contact{" "}
        <a href="mailto:sales@techrevenuebrief.com">
          sales@techrevenuebrief.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
