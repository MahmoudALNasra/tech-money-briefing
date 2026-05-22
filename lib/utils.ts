export function calculateReadingTime(content: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 225));
}
