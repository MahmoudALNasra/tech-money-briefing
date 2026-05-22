import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Advertise with Tech Revenue Brief."
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
