export const SOCIAL_AI_SIGNAL_PATTERNS: RegExp[] = [
  /\bmost don'?t\b/i,
  /\bI'?ve seen this play out\b/i,
  /\bcheck out the insights\b/i,
  /\bcrucial\b/i,
  /\bintegrating tools?\b/i,
  /\bfrom the onset\b/i,
  /\bfrom the start is key\b/i,
  /\bheadache for many\b/i,
  /\bwhy\?\s*[\p{Extended_Pictographic}]/iu,
  /\bgauge success\b/i,
  /\bmaking it nearly impossible\b/i,
  /\bplays out too many times\b/i,
  /\binsights from\b/i,
  /\bthat'?s crucial\b/i,
  /\bit'?s crucial\b/i,
  /\bthe key is\b/i,
  /\bkey is integrating\b/i,
  /\bvague kpis\b/i,
  /\bmissed tracking opportunities\b/i,
  /\blead to confusion\b/i,
  /\benterprises struggle\b/i,
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\bin today'?s\b/i,
  /\bgame[- ]changer\b/i,
  /\bleverage\b/i,
  /\bunlock\b/i,
  /\bstreamline\b/i,
  /\brobust\b/i,
  /\bseamless\b/i,
  /\bdelve\b/i,
  /\bnavigating the\b/i,
  /\bhere'?s the thing\b/i,
  /\blet'?s dive in\b/i,
  /\bthis helps\b/i,
  /\bit is (important|essential|crucial)\b/i,
  /\bplays a (crucial|important|key) role\b/i
];

export function scanSocialAiSignals(...texts: string[]) {
  const haystack = texts.join("\n");
  return SOCIAL_AI_SIGNAL_PATTERNS.filter((pattern) => pattern.test(haystack)).map(
    (pattern) => pattern.source
  );
}

export function countShortAndLongSentences(text: string) {
  const sentences =
    text.match(/[^.!?\n]+[.!?]+/g)?.map((sentence) => sentence.trim()) ?? [];

  if (sentences.length === 0) {
    return { short: 0, long: 0, total: 0 };
  }

  let short = 0;
  let long = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    if (words <= 8) {
      short += 1;
    }
    if (words >= 18) {
      long += 1;
    }
  }

  return { short, long, total: sentences.length };
}

export function detectSocialCopyIssues(input: {
  linkedin: string;
  instagram: string;
}) {
  const issues: string[] = [...scanSocialAiSignals(input.linkedin, input.instagram)];

  const linkedinBurst = countShortAndLongSentences(input.linkedin);
  if (linkedinBurst.total >= 2 && linkedinBurst.short === 0) {
    issues.push("linkedin: no short sentences — add burstiness");
  }

  if (/^[\p{Extended_Pictographic}]/u.test(input.instagram.trim())) {
    issues.push("instagram: emoji opener");
  }

  const emojiCount = (
    input.instagram.match(/[\p{Extended_Pictographic}]/gu) ?? []
  ).length;
  if (emojiCount > 4) {
    issues.push("instagram: too many emojis");
  }

  return issues;
}
