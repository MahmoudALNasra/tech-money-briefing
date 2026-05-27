"use client";

import { useEffect } from "react";

type DeferredAdSenseProps = {
  client: string;
};

const ANALYTICS_OPT_OUT_KEY = "tech-revenue-brief-disable-analytics";

export function DeferredAdSense({ client }: DeferredAdSenseProps) {
  useEffect(() => {
    if (window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true") {
      return;
    }

    const load = () => {
      if (document.getElementById("adsbygoogle-loader")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "adsbygoogle-loader";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.body.appendChild(script);
    };

    const schedule = () => {
      const requestIdleCallback = (
        window as Window & {
          requestIdleCallback?: (
            callback: () => void,
            options?: { timeout: number }
          ) => void;
        }
      ).requestIdleCallback;

      if (requestIdleCallback) {
        requestIdleCallback(() => load(), { timeout: 4000 });
        return;
      }

      setTimeout(load, 3000);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
  }, [client]);

  return null;
}
