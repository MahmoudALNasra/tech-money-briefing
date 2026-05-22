const reservedRoutes = new Set(["api", "sitemap.xml", "robots.txt"]);

export function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return reservedRoutes.has(slug) ? `${slug}-article` : slug || "article";
}

export function normalizeCategory(input: string) {
  return slugify(input);
}
