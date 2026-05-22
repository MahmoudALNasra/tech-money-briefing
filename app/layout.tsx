import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
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
  const adClient = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT;
  const shouldLoadAds =
    process.env.NODE_ENV === "production" &&
    adClient &&
    !adClient.includes("0000000000000000");

  return (
    <html lang="en" className={geistSans.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <GoogleTagManager />
        {shouldLoadAds ? (
          <Script
            id="adsbygoogle-loader"
            strategy="afterInteractive"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
