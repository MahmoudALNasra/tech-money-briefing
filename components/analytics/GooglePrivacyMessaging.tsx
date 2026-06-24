"use client";

import Script from "next/script";

function getPublisherId() {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT?.trim();

  if (configured && !configured.includes("0000000000000000")) {
    return configured.replace(/^ca-pub-/, "pub-");
  }

  return "pub-8203750015609502";
}

export function GooglePrivacyMessaging() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const publisherId = getPublisherId();

  return (
    <Script
      id="google-funding-choices"
      strategy="beforeInteractive"
      src={`https://fundingchoicesmessages.google.com/i/${publisherId}`}
      async
    />
  );
}
