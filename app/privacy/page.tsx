import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how Tech Revenue Brief handles newsletter signups, analytics, advertising data, campaign tracking, and basic site privacy choices."
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="How we handle newsletter signups, analytics, and basic site data."
    >
      <p>
        This Privacy Policy explains how Tech Revenue Brief handles basic
        information collected through the site. By using the site, you agree to
        the practices described here.
      </p>
      <h2>Information We Collect</h2>
      <p>
        We collect newsletter email addresses when visitors voluntarily submit
        them. We use this information to send updates and related site
        communications.
      </p>
      <p>
        We also collect first-party analytics events such as page views, tool
        clicks, assistant usage, newsletter interactions, and session activity.
        These events may include page paths, referrer URLs, campaign parameters,
        device type, viewport size, timezone, language, and approximate location
        derived from hosting headers. We store anonymous visitor and session
        identifiers in browser local storage to understand returning usage
        without requiring login cookies.
      </p>
      <p>
        For analytics privacy, we store hashed versions of IP addresses and user
        agents rather than raw IP addresses in our first-party analytics
        database. We also attempt to exclude common crawlers, bots, and automated
        fetch tools from first-party analytics counts.
      </p>
      <p>
        When visitors use a campaign or custom tracking link, we may record the
        campaign name, destination path, referrer, browser user agent,
        approximate location from hosting headers, language preference, and a
        hashed version of the visitor IP address. We do not store raw IP
        addresses for custom link tracking.
      </p>
      <h2>Analytics and Advertising</h2>
      <p>
        We may use analytics and tag management tools to understand traffic,
        page performance, and reader engagement. These tools may process browser
        and device information according to their own policies.
      </p>
      <p>
        The site may use advertising services such as Google AdSense. Ad
        providers may use cookies or similar technologies to deliver, measure,
        and improve ads. You can manage ad personalization through your browser
        settings and Google account settings.
      </p>
      <h2>How We Use Information</h2>
      <p>
        We use collected information to operate the site, send newsletter
        updates, measure performance, improve editorial coverage, prevent abuse,
        and evaluate advertising or sponsorship effectiveness.
      </p>
      <h2>Your Choices</h2>
      <p>
        We do not sell subscriber email addresses. To request deletion of your
        email, contact{" "}
        <a href="mailto:hello@techrevenuebrief.com">
          hello@techrevenuebrief.com
        </a>
        .
      </p>
      <p>
        You can unsubscribe from newsletter communications at any time. You can
        also block cookies or tracking technologies in your browser, though some
        site features may not work as intended. You can disable analytics on
        this site by visiting any page with{" "}
        <code>?analytics=off</code> appended to the URL.
      </p>
      <h2>Policy Updates</h2>
      <p>
        We may update this policy as the site, analytics tools, or advertising
        integrations change. The latest version will always be available on this
        page.
      </p>
    </InfoPage>
  );
}
