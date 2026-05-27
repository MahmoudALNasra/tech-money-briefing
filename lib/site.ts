export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Automated News",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  ),
  description:
    "Tech Revenue Brief publishes practical briefings, referral guides, free tools, and software comparisons for AI builders, creators, marketers, and founders."
};

export function absoluteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteConfig.url}${normalizedPath}`;
}
