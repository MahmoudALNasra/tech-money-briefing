import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Review the Tech Revenue Brief terms for informational content, third-party links, acceptable use, no guaranteed results, and site changes."
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms of Use"
      description="Basic terms for using Tech Revenue Brief."
    >
      <h2>Informational Content</h2>
      <p>
        Content on this site is provided for informational purposes only. It is
        not financial, legal, tax, or investment advice.
      </p>
      <p>
        We aim for accuracy, but technology, monetization platforms, and market
        conditions change quickly. Readers should verify details before making
        business decisions.
      </p>
      <h2>No Guaranteed Results</h2>
      <p>
        Articles may discuss business models, monetization tactics, tools,
        platforms, and market opportunities. We do not guarantee income,
        rankings, traffic, funding, conversions, or business results.
      </p>
      <h2>Third-Party Sources and Links</h2>
      <p>
        We link to third-party websites, RSS sources, tools, platforms, and
        services. We are not responsible for the content, policies, availability,
        or practices of third-party sites.
      </p>
      <h2>Acceptable Use</h2>
      <p>
        By using this site, you agree not to misuse the service, scrape it
        abusively, or attempt to interfere with its availability.
      </p>
      <p>
        You also agree not to use the site for spam, unlawful activity,
        unauthorized automated requests, or attempts to compromise the platform,
        database, or hosting infrastructure.
      </p>
      <h2>Changes to These Terms</h2>
      <p>
        We may update these terms as the site evolves. Continued use of the site
        after changes are posted means you accept the updated terms.
      </p>
    </InfoPage>
  );
}
