export const DEFAULT_PRODUCTION_URL = "https://techrevenuebrief.com";

const LOCAL_URL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

function resolveSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_PRODUCTION_URL).replace(
    /\/$/,
    ""
  );

  if (/example\.com/i.test(configured) || LOCAL_URL_PATTERN.test(configured)) {
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
