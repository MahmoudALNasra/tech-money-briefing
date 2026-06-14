export const ARTICLE_EDITORIAL_SOURCE_NAME = "Tech Revenue Brief Editors";

export const ARTICLE_EDITORIAL_SOURCE_NOTE =
  "By Tech Revenue Brief Editors.";

export const ARTICLE_ORIGINALITY_INSTRUCTIONS = [
  "Use outside articles, RSS items, trends, or reference URLs as topic discovery and background context only.",
  "Do not copy the source structure, phrasing, or paragraph order. Rebuild the article from Tech Revenue Brief's own practical point of view.",
  "Do not include a visible Source, Original source, Read more, or citation footer unless the article uses a specific quote, statistic, official claim, or source-only fact that needs verification.",
  "Write with a direct, practical, slightly skeptical operator voice: ask whether the tool, tactic, or idea is actually useful, what it costs, what problem it solves, and what would make it worth skipping.",
  "Prefer real decision questions, simple examples, and business-owner logic over polished corporate language.",
  "Keep the style guide flexible because future owner-written samples may refine the voice."
];

export function stripGeneratedSourceFooter(content: string) {
  return content
    .replace(
      /\n{0,2}(?:\*\*)?Source(?: Attribution)?(?:\*\*)?:[^\n]*(?:\n\s*(?:Read more|Visit|Original source):[^\n]*)?/gi,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
