import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Tech Revenue Brief."
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="How we handle newsletter signups, analytics, and basic site data."
    >
      <p>
        We collect newsletter email addresses when visitors voluntarily submit
        them. We use this information to send updates and related site
        communications.
      </p>
      <p>
        We may use analytics and tag management tools to understand traffic,
        page performance, and reader engagement. These tools may process browser
        and device information according to their own policies.
      </p>
      <p>
        We do not sell subscriber email addresses. To request deletion of your
        email, contact{" "}
        <a href="mailto:hello@techrevenuebrief.com">
          hello@techrevenuebrief.com
        </a>
        .
      </p>
    </InfoPage>
  );
}
