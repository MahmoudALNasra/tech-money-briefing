/**
 * Shared content-quality rules for article generation and owner-voice rewrites.
 * Aimed at AdSense readiness: varied structure, concrete facts, no templated voice.
 */

import { OWNER_VOICE_AUTHENTICITY_CRITERIA } from "./owner-voice/authenticity";

export const ARTICLE_KEY_TAKEAWAY_INSTRUCTIONS = [
  "Generate exactly 3 key_takeaways as short standalone sentences.",
  "Each takeaway must summarize one specific point from THIS article — a fact, number, named tool, decision, or concrete next step tied to the topic.",
  "Do NOT use a fixed rhetorical formula across all three takeaways. Avoid making every bullet start with the same pattern (e.g. all 'I would...', all 'Don't...', or all 'Your...').",
  "Vary structure naturally: one takeaway can state a fact, another a caution, another a specific action — but each must be grounded in this article's content.",
  "Do not repeat the same sentence shape as the article opening or section bullets."
];

export const ARTICLE_EVENT_FACT_INSTRUCTIONS = [
  "For articles about a named, specific event (legal case, funding round, layoff, acquisition, product launch, executive move, regulatory action): include verifiable specifics from the source material.",
  "Required when known from the source: who is involved, what happened, when (date or timeframe), dollar amounts or headcount, charges or claims, court/agency, and current status.",
  "Do not substitute generic industry advice that could apply without naming the event. The headline subject must be explained with actual facts.",
  "If the source lacks key facts, state what is verified and what is still unknown — do not fill gaps with boilerplate compliance or strategy advice."
];

export const ARTICLE_ADVISORY_SPECIFICITY_INSTRUCTIONS = [
  "For how-to, SEO, or advisory articles: each major section needs at least one concrete detail — a named tool with what it does, a realistic timeframe, a number, a workflow step, or a specific check.",
  "Reject filler that could apply to any business unchanged ('focus on quality content', 'build backlinks', 'be patient', 'submit your sitemap') unless immediately followed by a specific method, tool, or example.",
  "Prefer one real example, benchmark, or decision rule per section over three vague recommendations."
];

export const ARTICLE_STRUCTURAL_VARIATION_INSTRUCTIONS = [
  "Vary article structure across pieces. Do not default every article to the same opening style, heading order, or rhetorical rhythm.",
  "Rotate opening styles: direct answer, specific fact, contrarian claim, practical question, or short scenario — not the same skepticism formula every time.",
  "Do not start multiple paragraphs or sections with the same phrase pattern (especially repeated 'I would not', 'Don't assume', or 'Your X').",
  "Headings should be specific to the topic, not interchangeable SEO labels."
];

export const ARTICLE_OWNER_VOICE_VARIATION_INSTRUCTIONS = [
  "First-person operator voice is welcome, but it must not collapse into a single template. Use 'I' when it adds judgment; do not force 'I would not' openers on every section.",
  "Skepticism should come from specific trade-offs and examples, not from repeating the same negation pattern in every paragraph.",
  "Match the gold-standard rhythm (plain, practical, specific) without copying its exact opener every time.",
  ...OWNER_VOICE_AUTHENTICITY_CRITERIA
];

export function getGenerationQualityInstructions() {
  return [
    ...ARTICLE_KEY_TAKEAWAY_INSTRUCTIONS,
    ...ARTICLE_EVENT_FACT_INSTRUCTIONS,
    ...ARTICLE_ADVISORY_SPECIFICITY_INSTRUCTIONS,
    ...ARTICLE_STRUCTURAL_VARIATION_INSTRUCTIONS
  ];
}

const EVENT_TITLE_PATTERN =
  /\b(lawsuit|legal|charged|conviction|layoff|layoffs|funding|raised|acquisition|valuation|ipo|merger|bankruptcy|settlement|indictment|sec\b|ftc\b|fda\b|arrest|guilty|verdict|fine|penalty)\b/i;

const EVENT_TITLE_IMPLICATIONS =
  /\b(implications of|case study|analyzing\b.+['']s\b)/i;

export function looksLikeEventArticle(title: string) {
  return EVENT_TITLE_PATTERN.test(title) || EVENT_TITLE_IMPLICATIONS.test(title);
}

export function detectRepetitiveTakeawayPattern(takeaways: string[]) {
  const issues: string[] = [];
  const iWouldStarts = takeaways.filter((item) =>
    /^I would\b/i.test(item.trim())
  ).length;
  const dontStarts = takeaways.filter((item) =>
    /^Don'?t\b/i.test(item.trim())
  ).length;
  const yourStarts = takeaways.filter((item) =>
    /^Your\b/i.test(item.trim())
  ).length;

  if (iWouldStarts >= 2) {
    issues.push(
      'key_takeaways: too many start with "I would" — summarize specific facts or actions instead'
    );
  }
  if (dontStarts >= 2) {
    issues.push(
      'key_takeaways: too many start with "Don\'t" — vary takeaway structure'
    );
  }
  if (yourStarts >= 2) {
    issues.push(
      'key_takeaways: too many start with "Your" — vary takeaway structure'
    );
  }

  const formulaCount = Math.max(iWouldStarts, dontStarts, yourStarts);
  if (formulaCount === 3) {
    issues.push("key_takeaways: all three use the same rhetorical formula");
  }

  return issues;
}

export function detectOverusedRhetoricalPattern(content: string) {
  const issues: string[] = [];
  const iWouldNot = (content.match(/\bI would not\b/gi) ?? []).length;

  if (iWouldNot >= 3) {
    issues.push(
      `repeated "I would not" pattern (${iWouldNot} times) — vary rhetorical framing`
    );
  }

  const iWouldCheck = (content.match(/\bI would check that first\b/gi) ?? []).length;
  if (iWouldCheck >= 1) {
    issues.push('automated "I would check that first" filler — rewrite opener naturally');
  }

  const boxToCheck = /\blike a box to check\b/i.test(content);
  if (boxToCheck) {
    issues.push('templated "like a box to check" opener — use a specific scenario instead');
  }

  const dontAssume = (content.match(/\bDon'?t assume\b/gi) ?? []).length;
  if (dontAssume >= 2) {
    issues.push('repeated "Don\'t assume" pattern');
  }

  return issues;
}

export function detectThinEventCoverage(title: string, content: string) {
  if (!looksLikeEventArticle(title)) {
    return [];
  }

  const hasYear = /\b20\d{2}\b/.test(content);
  const hasMoney = /\$[\d,.]+[bmk]?|\b\d+(\.\d+)?\s*(million|billion|m\b|b\b)\b/i.test(
    content
  );
  const hasMonth = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
    content
  );

  if (!hasYear && !hasMoney && !hasMonth) {
    return [
      "event article missing concrete dates, amounts, or status specifics from the source"
    ];
  }

  return [];
}

export function detectGenericAdviceDensity(content: string) {
  const genericPhrases = [
    /\bfocus on quality content\b/i,
    /\bbuild (quality )?backlinks\b/i,
    /\bbe patient\b/i,
    /\bsubmit (your )?sitemap\b/i,
    /\bquality over quantity\b/i,
    /\bstay (compliant|up to date)\b/i
  ];

  const hits = genericPhrases.filter((pattern) => pattern.test(content)).length;

  return hits >= 3
    ? [
        "too much generic advice without concrete tools, numbers, or examples nearby"
      ]
    : [];
}
