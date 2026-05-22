import Script from "next/script";

type GoogleTagManagerProps = {
  containerId?: string;
};

export function GoogleTagManager({
  containerId = process.env.NEXT_PUBLIC_GTM_ID
}: GoogleTagManagerProps) {
  if (!containerId) {
    return null;
  }

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        `}
      </Script>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtm.js?id=${containerId}`}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          className="hidden invisible"
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
