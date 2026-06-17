import Script from "next/script";

type GoogleTagManagerProps = {
  containerId?: string;
};

const ANALYTICS_OPT_OUT_KEY = "tech-revenue-brief-disable-analytics";
const DEFAULT_CONTAINER_ID = "GTM-K3XRLKRF";

function getGtmSnippet(containerId: string) {
  return `
    (function(w,d,s,l,i){
      var params = new URLSearchParams(w.location.search);
      var shouldDisable = params.get("analytics") === "off" || params.get("noanalytics") === "1";
      var shouldEnable = params.get("analytics") === "on";
      var optOutKey = ${JSON.stringify(ANALYTICS_OPT_OUT_KEY)};

      function loadGtm() {
        w[l]=w[l]||[];
        w[l].push({"gtm.start": new Date().getTime(), event:"gtm.js"});
        var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),
          dl=l!="dataLayer"?"&l="+l:"";
        j.async=true;
        j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;
        f.parentNode.insertBefore(j,f);
      }

      if (shouldDisable) {
        w.localStorage.setItem(optOutKey, "true");
        return;
      }

      if (shouldEnable) {
        w.localStorage.removeItem(optOutKey);
      } else if (w.localStorage.getItem(optOutKey) === "true") {
        return;
      }

      fetch("/api/analytics/eligibility", { cache: "no-store" })
        .then(function(response) {
          return response.ok ? response.json() : { excluded: false };
        })
        .then(function(json) {
          if (json && json.excluded) {
            w.localStorage.setItem(optOutKey, "true");
            return;
          }

          loadGtm();
        })
        .catch(function() {
          loadGtm();
        });
    })(window,document,"script","dataLayer",${JSON.stringify(containerId)});
  `;
}

export function GoogleTagManager({
  containerId = process.env.NEXT_PUBLIC_GTM_ID ?? DEFAULT_CONTAINER_ID
}: GoogleTagManagerProps) {
  if (!containerId) {
    return null;
  }

  return (
    <>
      <Script
        id="gtm-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: getGtmSnippet(containerId) }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
