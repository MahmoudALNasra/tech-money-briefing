import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Tech Revenue Brief."
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Terms of Use"
      description="Basic terms for using Tech Revenue Brief."
    >
      <p>
        Content on this site is provided for informational purposes only. It is
        not financial, legal, tax, or investment advice.
      </p>
      <p>
        We aim for accuracy, but technology, monetization platforms, and market
        conditions change quickly. Readers should verify details before making
        business decisions.
      </p>
      <p>
        By using this site, you agree not to misuse the service, scrape it
        abusively, or attempt to interfere with its availability.
      </p>
    </InfoPage>
  );
}
