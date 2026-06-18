const TITLE_SUFFIX_PATTERN =
  /\s*[—–-]\s*(I would not|I would|How I would|Why I would)\b.+$/i;

const BANNED_TITLE_PREFIX_PATTERNS = [
  /^I would not bet my revenue\b/i,
  /^I would not let the headline pick\b/i,
  /^I would not treat ".+" like a strategy doc\b/i
] as const;

export function detectTemplatedOwnerVoiceTitle(title: string) {
  const issues: string[] = [];
  const normalized = title.trim();

  if (TITLE_SUFFIX_PATTERN.test(normalized)) {
    issues.push("title has templated owner-voice em-dash suffix");
  }

  for (const pattern of BANNED_TITLE_PREFIX_PATTERNS) {
    if (pattern.test(normalized)) {
      issues.push(`title matches banned template: ${pattern.source}`);
    }
  }

  return issues;
}

export function cleanOwnerVoiceArticleTitle(title: string) {
  const original = title.trim();
  let cleaned = original;

  if (TITLE_SUFFIX_PATTERN.test(cleaned)) {
    cleaned = cleaned.replace(TITLE_SUFFIX_PATTERN, "").trim();
  }

  cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/[.…]+$/g, "").trim();

  return {
    cleaned,
    changed: cleaned !== original,
    original
  };
}

export const OWNER_VOICE_TITLE_INSTRUCTIONS = [
  "Titles must be clear, clickable, and SEO-friendly — written for humans scanning a feed, not as owner-voice slogans.",
  "Never append an em-dash suffix like '— I would not…' or '— I would…' to the title.",
  "Do not start titles with 'I would not', 'How I would', or 'Why I would' unless the entire title is a natural question the reader would search (rare).",
  "Prefer a direct headline: who/what happened, the practical question, or the specific outcome — not a negation formula.",
  "Title and first paragraph should not repeat the same 'I would not' framing."
];
