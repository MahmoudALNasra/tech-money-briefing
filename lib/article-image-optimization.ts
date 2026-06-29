export function shouldBypassArticleImageOptimization(
  url: string | null | undefined
) {
  if (!url) {
    return false;
  }

  return (
    url.startsWith("http") ||
    url.startsWith("/media/articles/") ||
    url.startsWith("/generated/article-")
  );
}

/**
 * Some data-heavy screenshots (especially case studies) should render contained
 * in cards to avoid important chart regions getting cropped.
 */
export function shouldContainArticleImagePreview(input: {
  slug?: string | null;
  imageUrl?: string | null;
}) {
  const slug = (input.slug ?? "").toLowerCase();
  const imageUrl = (input.imageUrl ?? "").toLowerCase();

  return (
    slug.startsWith("case-study-") ||
    imageUrl.includes("case-study-gsc-")
  );
}
