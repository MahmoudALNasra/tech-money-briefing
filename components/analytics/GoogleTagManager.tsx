"use client";

import { useEffect } from "react";

type GoogleTagManagerProps = {
  containerId?: string;
};

const ANALYTICS_OPT_OUT_KEY = "tech-revenue-brief-disable-analytics";

function analyticsDisabled() {
  const params = new URLSearchParams(window.location.search);
  const shouldDisable =
    params.get("analytics") === "off" || params.get("noanalytics") === "1";
  const shouldEnable = params.get("analytics") === "on";

  if (shouldDisable) {
    window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
    return true;
  }

  if (shouldEnable) {
    window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    return false;
  }

  return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
}

export function GoogleTagManager({
  containerId = process.env.NEXT_PUBLIC_GTM_ID
}: GoogleTagManagerProps) {
  useEffect(() => {
    if (!containerId || analyticsDisabled()) {
      return;
    }

    if (document.getElementById("gtm-script")) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    (window.dataLayer as Array<Record<string, unknown>>).push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js"
    });

    const script = document.createElement("script");
    script.id = "gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    document.head.appendChild(script);
  }, [containerId]);

  return null;
}
