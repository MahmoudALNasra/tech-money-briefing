"use client";

import Script from "next/script";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";

import {
  isTurnstileSiteKeyConfigured,
  shouldRenderTurnstileWidget
} from "@/lib/turnstile";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-api";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onError?: (errorCode: string) => void;
};

export type TurnstileWidgetHandle = {
  reset: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (errorCode: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          retry?: "auto" | "never";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

function turnstileErrorMessage(errorCode: string) {
  const code = Number.parseInt(errorCode, 10);
  const family = Number.isFinite(code) ? Math.floor(code / 1000) : 0;

  if (family === 110) {
    return "Security check configuration error. Confirm your domain is allowed in Cloudflare Turnstile.";
  }

  if (family === 200) {
    return "Security check could not load. Check your connection and try again.";
  }

  if (family === 300 || family === 600) {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "your domain";

    return `Security check failed. In Cloudflare Turnstile, add ${host} under Hostname Management, confirm your production site key and secret match, wait a minute, then retry.`;
  }

  return "Security check failed. Tap Retry below.";
}

function getTurnstileSize() {
  if (typeof window === "undefined") {
    return "normal" as const;
  }

  return window.matchMedia("(max-width: 640px)").matches ? "compact" : "normal";
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onToken, onError }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const renderedSizeRef = useRef<"normal" | "compact" | null>(null);
    const onTokenRef = useRef(onToken);
    const onErrorRef = useRef(onError);
    const [scriptReady, setScriptReady] = useState(false);
    const [widgetSize, setWidgetSize] = useState<"normal" | "compact">("normal");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const siteKey = isTurnstileSiteKeyConfigured()
      ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
      : undefined;

    onTokenRef.current = onToken;
    onErrorRef.current = onError;

    const clearWidget = useCallback(() => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      renderedSizeRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    }, []);

    const renderWidget = useCallback(
      (size: "normal" | "compact") => {
        if (!siteKey || !containerRef.current || !window.turnstile) {
          return false;
        }

        if (containerRef.current.getBoundingClientRect().width <= 0) {
          return false;
        }

        if (widgetIdRef.current && renderedSizeRef.current === size) {
          return true;
        }

        clearWidget();

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          size,
          retry: "auto",
          callback: (token) => {
            setErrorMessage(null);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": (errorCode) => {
            onTokenRef.current("");
            const message = turnstileErrorMessage(errorCode);
            setErrorMessage(message);
            onErrorRef.current?.(errorCode);
          }
        });
        renderedSizeRef.current = size;

        return Boolean(widgetIdRef.current);
      },
      [clearWidget, siteKey]
    );

    const resetWidget = useCallback(() => {
      setErrorMessage(null);
      onTokenRef.current("");

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        return;
      }

      clearWidget();
      renderWidget(renderedSizeRef.current ?? widgetSize);
    }, [clearWidget, renderWidget, widgetSize]);

    useImperativeHandle(
      ref,
      () => ({
        reset: resetWidget
      }),
      [resetWidget]
    );

    useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }

      if (window.turnstile) {
        setScriptReady(true);
      }

      const timeoutId = window.setTimeout(() => {
        if (window.turnstile) {
          setScriptReady(true);
        }
      }, 2500);

      const intervalId = window.setInterval(() => {
        if (window.turnstile) {
          setScriptReady(true);
          window.clearInterval(intervalId);
        }
      }, 100);

      return () => {
        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);
      };
    }, []);

    useEffect(() => {
      const nextSize = getTurnstileSize();
      setWidgetSize(nextSize);

      const mediaQuery = window.matchMedia("(max-width: 640px)");
      const onMediaChange = () => {
        setWidgetSize(getTurnstileSize());
      };
      mediaQuery.addEventListener("change", onMediaChange);

      return () => {
        mediaQuery.removeEventListener("change", onMediaChange);
      };
    }, []);

    useEffect(() => {
      if (!scriptReady) {
        return;
      }

      let cancelled = false;
      let frameId = 0;
      let attempts = 0;

      const tryRender = () => {
        if (cancelled) {
          return;
        }

        if (renderWidget(widgetSize)) {
          return;
        }

        attempts += 1;
        if (attempts < 20) {
          frameId = window.requestAnimationFrame(tryRender);
        }
      };

      tryRender();

      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frameId);
        clearWidget();
      };
    }, [clearWidget, renderWidget, scriptReady, widgetSize]);

    if (!siteKey || !shouldRenderTurnstileWidget()) {
      return null;
    }

    const scriptAlreadyLoaded =
      typeof document !== "undefined" &&
      Boolean(document.getElementById(TURNSTILE_SCRIPT_ID));

    return (
      <>
        {!scriptAlreadyLoaded ? (
          <Script
            id={TURNSTILE_SCRIPT_ID}
            src={TURNSTILE_SCRIPT_SRC}
            strategy="afterInteractive"
            onLoad={() => setScriptReady(true)}
            onReady={() => setScriptReady(true)}
          />
        ) : null}
        <div className="relative isolate mt-3 w-full max-w-full">
          <div
            ref={containerRef}
            className="min-h-[65px] w-full max-w-[304px] overflow-visible"
            style={{ minWidth: widgetSize === "compact" ? 150 : 300 }}
          />
          {errorMessage ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-semibold leading-5 text-amber-700">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  onTokenRef.current("");
                  clearWidget();
                  renderWidget(widgetSize);
                }}
                className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-900"
              >
                Retry security check
              </button>
            </div>
          ) : null}
        </div>
      </>
    );
  }
);
