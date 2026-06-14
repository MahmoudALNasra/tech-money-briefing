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
    "who are my competitors",
    "competitor list generator",
    "local competitor research",
    "nearby business competitors",
    "local lead list generator",
    "Google Maps business scraper",
    "business prospecting tool",
    "local business leads",
    "website audit leads",
    "AI business pitch generator"
  ],
  alternates: {
    canonical: absoluteUrl("/business-data-generator")
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/business-data-generator"),
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does the business data generator do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It helps users find nearby businesses by location, radius, and category, then preview structured records such as name, address, phone, website, rating, reviews, and Google Maps link."
      }
    },
    {
      "@type": "Question",
      name: "Can I export the results?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The free version provides a small preview. Paid exports unlock larger result sets, formatted Excel workbooks, public email candidates, website analysis, and AI pitch recommendations for every exported business."
      }
    },
    {
      "@type": "Question",
      name: "Does the app send cold emails?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The app is designed for business research, exports, and website opportunity analysis. Users control any outreach outside the app."
      }
    }
  ]
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: pageTitle,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/business-data-generator"),
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

export default function BusinessDataGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <ToolPageShell
        eyebrow="Competitor research tool"
        title="Find competitors and local business leads from any location"
        description="Search a city, address, business name, or map area to discover nearby competitors, local companies, and prospecting opportunities with clean export-ready data."
        secondaryCopy="Built for agencies, local business owners, founders, sales teams, and freelancers who need competitor research, local market data, and outreach-ready business lists without messy spreadsheets."
        showMonetizationRail={false}
        showAssistant={false}
        newsletterSource="business_data_generator"
        contentMaxWidthClassName="max-w-[1500px]"
        heroMaxWidthClassName="max-w-[1400px]"
      >
        <BusinessDataGenerator />

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm sm:p-8">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Competitor research
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
              Want to know who your competitors are? Start with the local map.
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              If you are asking "who are my competitors?", "what businesses compete with me
              nearby?", or "how do I find local competitors for a new market?", this business data
              generator gives you a practical starting point. Search by city, neighborhood, address,
              landmark, or business category, then build a structured competitor list from local
              Google Maps-style business data.
            </p>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Use it for local competitor analysis, business prospecting, agency lead generation,
              market research, sales territory research, local SEO research, and website opportunity
              discovery. Instead of copying competitor names by hand, you can preview businesses,
              choose how many to process, and export an Excel report with phone numbers, websites,
              ratings, reviews, map links, public email candidates, and website signals.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              "Find local competitors by category and radius",
              "Build competitor lists for any city or neighborhood",
              "Export business data for sales, SEO, and outreach",
              "Compare nearby businesses by website and marketing signals",
              "Research local markets before opening or expanding",
              "Discover businesses missing tracking, schema, or stronger websites"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm font-black leading-6 text-emerald-950 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "For local businesses",
              copy:
                "See the restaurants, clinics, contractors, shops, salons, agencies, or service providers competing in your area before you spend on ads, SEO, or expansion."
            },
            {
              title: "For agencies and consultants",
              copy:
                "Create targeted local lead lists, spot weak competitor websites, and prioritize accounts that have visible marketing gaps or website improvement opportunities."
            },
            {
              title: "For founders and sales teams",
              copy:
                "Map a territory, validate demand, find nearby businesses in a niche, and export a cleaner prospecting workbook for follow-up research."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-black text-ink">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{item.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
            Search examples
          </p>
          <h2 className="mt-3 text-2xl font-black text-ink">
            Keyword searches this competitor tool is built for
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "local competitor analysis tool",
              "find competitors near me",
              "who are my local competitors",
              "competitor list generator",
              "business data generator",
              "local business leads",
              "Google Maps business data",
              "agency prospecting list"
            ].map((keyword) => (
              <div
                key={keyword}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black text-stone-700"
              >
                {keyword}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              Why this exists
            </p>
            <h2 className="mt-3 text-2xl font-black text-ink">
              Prospecting data should be clean before it becomes outreach.
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              Most local prospecting starts with messy spreadsheets, copied map
              results, and no clear signal about which businesses actually need
              help. This tool starts with structured location data, then layers
              website and marketing signals only when they add value.
            </p>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-ink">
              What paid results include
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Email discovery from public websites",
                "GA4, GTM, Meta Pixel, and schema checks",
                "Website speed and mobile opportunity signals",
                "AI website analysis and pitch recommendations",
                "CSV, Excel, and Google Drive export",
                "Saved searches and reusable lists"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </ToolPageShell>
    </>
  );
}
