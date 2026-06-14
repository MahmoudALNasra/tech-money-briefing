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

export const OWNER_VOICE_REWRITE_GUIDE = [
  "The owner voice is direct, practical, and a little skeptical. It often starts from a real question: do I actually need this, will it save time, is it worth paying for, and what problem does it solve?",
  "Keep a human reasoning flow: personal observation, practical example, questions a business owner would ask, trade-offs, then a clear takeaway.",
  "Use simple business-owner logic around time, money, effort, marketing, tools, and whether something creates real value. Avoid sounding like a polished corporate blog.",
  "It is okay to include honest doubts and decision questions, but keep grammar clean enough for readers and search engines.",
  "Prefer concrete examples: AI agents, Google Business/Profile data, Google Maps research, APIs, paid tools, local businesses, small websites, referrals, ads, and manual work versus automation.",
  "Avoid generic AI hype. Make the article useful by explaining when a tool helps, when it does not, what can go wrong, and what the reader should check before spending time or money.",
  "Do not copy outside articles. Use the old article only as topic context and rebuild the body in an original Tech Revenue Brief voice.",
  "Keep paragraphs short. Use clear ## headings, a Quick Answer, practical decision points, and FAQ when useful."
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
