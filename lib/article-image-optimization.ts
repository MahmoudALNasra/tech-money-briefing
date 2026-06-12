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
