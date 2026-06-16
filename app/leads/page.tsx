import type { Metadata } from "next";

import { BusinessDataGenerator } from "@/components/business-data/BusinessDataGenerator";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { absoluteUrl, siteConfig } from "@/lib/site";

const pageTitle = "Local Lead Generator";
const pageDescription =
  "Find local businesses, competitors, phone numbers, websites, ratings, emails, and outreach recommendations. Export lead reports to Excel or Google Drive.";
const pageImage = absoluteUrl("/og-business-data-generator.png");

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "business data generator",
    "competitor research tool",
    "local competitor analysis",
    "find local competitors",
    "local lead list generator",
    "business prospecting tool",
    "local business leads",
    "website audit leads"
  ],
  alternates: {
    canonical: absoluteUrl("/leads")
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/leads"),
    type: "website",
    images: [
      {
        url: pageImage,
        width: 1024,
        height: 568,
        alt: pageTitle
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [pageImage]
  },
  robots: {
    index: true,
    follow: true
  }
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: pageTitle,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/leads"),
  description: pageDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free preview with paid export options."
  },
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url
  }
};

export default function LeadsPage() {

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <ToolPageShell
        eyebrow="Lead generation tool"
        title="Find local businesses ready to buy"
        description="Search a city, address, business name, or map area to discover nearby companies, contact details, and prospecting opportunities with clean export-ready data."
        secondaryCopy="Built for agencies, founders, sales teams, and freelancers who need local market data without messy spreadsheets."
        showMonetizationRail={false}
        showAssistant={false}
        newsletterSource="leads_tool"
        contentMaxWidthClassName="max-w-[1500px]"
        heroMaxWidthClassName="max-w-[1400px]"
      >
        <BusinessDataGenerator />
      </ToolPageShell>
    </>
  );
}
