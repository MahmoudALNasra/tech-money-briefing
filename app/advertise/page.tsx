import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Advertise",
  description:
    "Advertise with Tech Revenue Brief to reach founders, creators, marketers, ecommerce operators, and AI tool buyers reading high-intent guides."
};

export default function AdvertisePage() {
  return (
    <InfoPage
      eyebrow="Advertise"
      title="Reach tech monetization builders"
      description="Partner with a focused publication for creators, founders, marketers, ecommerce operators, and AI tool builders."
    >
      <p>
        {`Tech Revenue Brief offers native partner placements, newsletter sponsorship opportunities, and category-aligned promotions for products serving online business builders.`}
      </p>
      <p>
        Good-fit sponsors include SaaS tools, AI products, analytics platforms,
        ecommerce apps, creator tools, payment products, hosting services, and
        growth software.
      </p>
      <h2>Audience</h2>
      <p>
        Our readers are builders and operators looking for practical ways to use
        technology to grow revenue. They include creators, founders, ecommerce
        sellers, marketers, SEO operators, consultants, and software buyers.
      </p>
      <h2>Available Placements</h2>
      <ul>
        <li>Native partner cards inside article feeds.</li>
        <li>Newsletter sponsorship and callout opportunities.</li>
        <li>Category-aligned campaigns for AI tools, SEO, ecommerce, fintech, and startups.</li>
        <li>Custom promoted resources for tools, guides, reports, and launches.</li>
      </ul>
      <h2>What We Accept</h2>
      <p>
        We prioritize relevant products and services that help readers build,
        market, monetize, automate, analyze, or operate online businesses. We do
        not accept misleading offers, guaranteed-income schemes, or promotions
        that do not fit the site thesis.
      </p>
      <h2>Disclosure</h2>
      <p>
        Sponsored placements, affiliate relationships, and paid promotions may
        be labeled where appropriate. Editorial relevance and reader trust come
        first.
      </p>
      <p>
        To discuss sponsorships, email{" "}
        <a href="mailto:ads@techrevenuebrief.com">
          ads@techrevenuebrief.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
