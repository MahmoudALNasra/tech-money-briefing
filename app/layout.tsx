import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { siteConfig } from "@/lib/site";

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
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description
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

  return (
    <html lang="en" className={geistSans.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {shouldLoadAds ? (
          <Script
            id="adsbygoogle-loader"
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
        <GoogleTagManager />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
