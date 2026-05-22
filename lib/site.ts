export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Automated News",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  ),
  description:
    "An automated, AI-assisted news and blog aggregator built for fast discovery, objective summaries, and clean reading."
};

export function absoluteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteConfig.url}${normalizedPath}`;
}
