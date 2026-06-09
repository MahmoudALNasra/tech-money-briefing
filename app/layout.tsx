import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { DeferredAdSense } from "@/components/analytics/DeferredAdSense";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { VisitorAnalytics } from "@/components/analytics/VisitorAnalyticsShell";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ReferralNudge } from "@/components/referrals/ReferralNudge";
import { absoluteUrl, siteConfig } from "@/lib/site";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  publisher: siteConfig.name,
  keywords: [
    "Tech Revenue Brief",
    "SEO tools",
    "software comparisons",
    "AI tools",
    "publisher monetization",
    "creator business",
    "Google Search Console",
    "Google Analytics",
    "free SEO tools"
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl("/og-default-v3.png"),
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [absoluteUrl("/og-default-v3.png")]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const configuredAdClient = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT;
  const adClient =
    configuredAdClient && !configuredAdClient.includes("0000000000000000")
      ? configuredAdClient
      : "ca-pub-8203750015609502";
  const shouldLoadAds = process.env.NODE_ENV === "production";
  const shouldShowReferralNudge =
    process.env.NEXT_PUBLIC_ENABLE_REFERRAL_NUDGE === "true";

  return (
    <html
      lang="en"
      className={geistSans.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Script
          id="pre-hydration-dom-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){function cleanNode(node){if(!node||node.nodeType!==1)return;node.removeAttribute("data-google-analytics-opt-out");node.removeAttribute("bis_skin_checked");if(node.querySelectorAll){node.querySelectorAll("[data-google-analytics-opt-out],[bis_skin_checked]").forEach(function(el){el.removeAttribute("data-google-analytics-opt-out");el.removeAttribute("bis_skin_checked")})}}function clean(){cleanNode(document.documentElement)}clean();var observer=new MutationObserver(function(mutations){mutations.forEach(function(mutation){cleanNode(mutation.target);mutation.addedNodes&&mutation.addedNodes.forEach(cleanNode)})});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["data-google-analytics-opt-out","bis_skin_checked"]});window.setTimeout(function(){observer.disconnect();clean()},8000)})();`
          }}
        />
        {shouldLoadAds ? <DeferredAdSense client={adClient} /> : null}
        <GoogleTagManager />
        <VisitorAnalytics />
        {children}
        {shouldShowReferralNudge ? <ReferralNudge /> : null}
        <SiteFooter />
      </body>
    </html>
  );
}
