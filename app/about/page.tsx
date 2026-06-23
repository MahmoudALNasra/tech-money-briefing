import type { Metadata } from "next";

import { buildPageMetadata, siteSocialProfiles } from "@/lib/page-metadata";

import { InfoPage } from "@/components/layout/InfoPage";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "About",
  description: `About ${siteConfig.name}, a briefing site for tech monetization, online business, and builder revenue.`,
  path: "/about"
});

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
      <h2>What We Cover</h2>
      <p>
        We focus on practical business signals: new software tools, platform
        changes, search updates, ecommerce tactics, creator monetization,
        startup trends, payment products, and AI workflows that can affect how
        online businesses grow revenue.
      </p>
      <h2>Who It Is For</h2>
      <p>
        The publication is built for creators, indie hackers, SaaS founders,
        affiliate marketers, ecommerce operators, SEO builders, newsletter
        operators, consultants, and technical buyers who want a clearer view of
        where digital revenue opportunities are moving.
      </p>
      <h2>How It Works</h2>
      <p>
        We monitor public RSS sources, filter for relevance, and use AI-assisted
        analysis to produce short briefings. Each article is designed to explain
        why a development matters, what opportunities it may create, and what
        readers should watch before acting on it.
      </p>
      <p>
        Every briefing links to the original source, includes a practical
        takeaway section, and is reviewed for clarity, attribution, and fit with
        our monetization-focused editorial scope before publication.
      </p>
      <h2>Editorial Standards</h2>
      <p>
        We prioritize original analysis, useful tools, comparison pages, and
        category briefings that help founders, marketers, and operators make
        better revenue decisions. We avoid publishing thin pages, duplicate
        summaries, or off-topic trend noise.
      </p>
      <h2>Find Us</h2>
      <p>
        Follow {siteConfig.name} on{" "}
        <a href={siteSocialProfiles.linkedin} rel="noopener noreferrer" target="_blank">
          LinkedIn
        </a>
        ,{" "}
        <a href={siteSocialProfiles.instagram} rel="noopener noreferrer" target="_blank">
          Instagram
        </a>
        ,{" "}
        <a href={siteSocialProfiles.github} rel="noopener noreferrer" target="_blank">
          GitHub
        </a>
        , and{" "}
        <a href={siteSocialProfiles.crunchbase} rel="noopener noreferrer" target="_blank">
          Crunchbase
        </a>
        .
      </p>
      <p>
        Questions, corrections, or partnership requests can be sent through our{" "}
        <a href="/contact">contact page</a> or{" "}
        <a href="mailto:hello@techrevenuebrief.com">
          hello@techrevenuebrief.com
        </a>
        .
      </p>
      <p>
        We are not a financial adviser, investment adviser, or legal adviser.
        Readers should verify important details before making business,
        investment, tax, or legal decisions.
      </p>
    </InfoPage>
  );
}
