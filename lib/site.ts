const DEFAULT_PRODUCTION_URL = "https://techrevenuebrief.com";

function resolveSiteUrl() {
  const configured = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? DEFAULT_PRODUCTION_URL
      : "http://localhost:3000")
  ).replace(/\/$/, "");

  if (/example\.com/i.test(configured)) {
    return DEFAULT_PRODUCTION_URL;
  }

  return configured;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Automated News",
  url: resolveSiteUrl(),
  description:
    "Tech Revenue Brief publishes practical briefings, referral guides, free tools, and software comparisons for AI builders, creators, marketers, and founders."
};

export function absoluteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteConfig.url}${normalizedPath}`;
}
