import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name}, a briefing site for tech monetization, online business, and builder revenue.`
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title={`About ${siteConfig.name}`}
      description="We track how technology creates revenue opportunities for creators, founders, marketers, ecommerce operators, and builders."
    >
      <p>
        {siteConfig.name} is a tech monetization briefing for people building,
        growing, and funding online businesses. We cover AI tools, startups,
        fintech, SEO, ecommerce, digital marketing, and creator business.
      </p>
      <p>
        Our goal is to turn noisy industry updates into concise, useful
        briefings with practical takeaways, risks, and revenue implications.
      </p>
    </InfoPage>
  );
}
