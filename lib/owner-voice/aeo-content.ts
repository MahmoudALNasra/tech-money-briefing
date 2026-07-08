/**
 * AEO structure for owner-voice articles — natural links only, no boilerplate injection.
 */

import { ARTICLE_EXTERNAL_LINK_PHRASES } from "@/lib/article-auto-links";

export const OWNER_VOICE_WORD_TARGETS = {
  min: 220,
  idealMin: 250,
  idealMax: 350,
  max: 400
} as const;

export const OWNER_VOICE_LINK_TARGETS = {
  minExternal: 1,
  maxExternal: 3,
  maxInternal: 2
} as const;

/** Auto-injected filler that fails AI detectors — never write or append these. */
export const OWNER_VOICE_LINK_FILLER_PATTERNS: RegExp[] = [
  /See \[[^\]]+\]\([^)]+\) for the official product page and current capabilities\.?/gi,
  /Official docs for \[[^\]]+\]\([^)]+\) are the right place to verify features before you commit\.?/gi,
  /\[[^\]]+\]\([^)]+\) covers the next step if you need a reference\.?/gi,
  /For reference, see \[[^\]]+\]\([^)]+\)\.?/gi,
  /is worth a look if this section applies to your stack\.?/gi
];

export const OWNER_VOICE_AEO_STRUCTURE_RULES = [
  "Open with a direct opinion hook — not a textbook definition.",
  "Include ## Quick Answer with 2–3 sentences that answer the query plainly — not link dumps.",
  "Add 3–4 short ## sections with topic-specific headings.",
  "Target 250–350 words. Dense beats padded.",
  "Link tool and org names inline inside real sentences — e.g. 'I check [Search Console](url) for index status' — never append a separate 'see X for the official product page' sentence.",
  "Use 1–2 external links (official tool/org URLs) and at most 1–2 internal links when they genuinely fit.",
  "Spread links across sections naturally. Never cluster filler links in ## Quick Answer.",
  "End on one sharp practical sentence — no recap."
] as const;

export const OWNER_VOICE_AEO_GOLD_EXCERPT = `I would not roll out Claude or ChatGPT company-wide because someone won a Twitter poll. Business assistants need policy, use cases, and a default for which model handles which work.

## Quick Answer

Pick one primary assistant for most teams, document when to use the backup, and test both on real contracts, SOPs, and support replies before you standardize prompts.

## Test on real work

Contracts summaries, SOP drafts, support replies, spreadsheet explanations, meeting notes.

Score: accuracy, tone, edit time, refusal behavior.

## Claude vs ChatGPT in practice

Teams often like [Claude](https://www.anthropic.com/claude) for long doc analysis and careful wording.

[ChatGPT](https://chat.openai.com) for breadth, plugins, and teams already on OpenAI.

Your mileage varies.

## Security and admin matter more than taste

SSO, retention settings, allowed data classes, logging.

A slightly better paragraph is not worth a compliance incident.

Pick one primary assistant, document when to use the backup, and train people like any other software — not like magic.`;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeHref(href: string) {
  return href.replace(/\/$/, "");
}

export function isInternalSiteLink(href: string) {
  if (href.startsWith("/")) {
    return true;
  }

  try {
    const hostname = new URL(href).hostname.toLowerCase();
    return (
      hostname === "techrevenuebrief.com" ||
      hostname === "www.techrevenuebrief.com"
    );
  } catch {
    return false;
  }
}

export function isExternalToolOrOrgLink(href: string) {
  return /^https?:\/\//i.test(href) && !isInternalSiteLink(href);
}

export function isValidMarkdownHref(href: string) {
  const cleaned = href.replace(/\s+/g, "");

  if (!cleaned) {
    return false;
  }

  if (cleaned.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(cleaned);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseMarkdownLinks(content: string) {
  return [...content.matchAll(/\[([^\]]+)]\(([^)]*)\)/g)].map((match) => ({
    label: match[1],
    href: match[2]
  }));
}

export function detectOwnerVoiceLinkFiller(content: string) {
  return OWNER_VOICE_LINK_FILLER_PATTERNS.filter((pattern) =>
    pattern.test(content)
  ).map((pattern) => `link filler detected: ${pattern.source}`);
}

export function stripOwnerVoiceLinkFiller(content: string) {
  let next = content;

  for (const pattern of OWNER_VOICE_LINK_FILLER_PATTERNS) {
    next = next.replace(pattern, "");
  }

  return collapseEmptyQuickAnswer(
    next.replace(/\n{3,}/g, "\n\n").trim()
  );
}

function collapseEmptyQuickAnswer(content: string) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const cleaned = blocks.filter((block) => {
    if (!/^##\s+Quick Answer\b/i.test(block)) {
      return true;
    }

    const body = block.replace(/^##\s+Quick Answer\s*/i, "").trim();
    return body.length > 0;
  });

  return cleaned.join("\n\n");
}

export function fixMalformedMarkdownLinks(content: string) {
  return content.replace(
    /\[([^\]]+)]\(([^)]*)\)/g,
    (match, label: string, href: string) => {
      const cleaned = href.replace(/\s+/g, "");

      if (!isValidMarkdownHref(cleaned)) {
        return label;
      }

      if (cleaned === href) {
        return match;
      }

      return `[${label}](${cleaned})`;
    }
  );
}

function normalizeComparableUrl(value: string) {
  return value
    .trim()
    .replace(/[),.;:!?]+$/g, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

/**
 * Prevent artifacts like:
 * [OpenAI](https://openai.com) https://openai.com
 * [OpenAI](https://openai.com) (https://openai.com)
 * [OpenAI](https://openai.com) <https://openai.com>
 */
export function stripMarkdownLinksFromHeadings(content: string) {
  return content.replace(/^(#{2,4}\s+)(.+)$/gm, (match, prefix: string, label: string) => {
    const cleaned = label
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .trim();

    return cleaned ? `${prefix}${cleaned}` : match;
  });
}

export function stripDuplicateRawUrlAfterMarkdownLink(content: string) {
  return content.replace(
    /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)\s*(?:<([^>]+)>|\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+))/gi,
    (match, label: string, href: string, angleUrl?: string, parenUrl?: string, rawUrl?: string) => {
      const duplicateCandidate = angleUrl ?? parenUrl ?? rawUrl;
      if (!duplicateCandidate) {
        return match;
      }

      const original = normalizeComparableUrl(href);
      const candidate = normalizeComparableUrl(duplicateCandidate);

      if (original !== candidate) {
        return match;
      }

      return `[${label}](${href})`;
    }
  );
}

export function countArticleWords(content: string) {
  return content
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countMarkdownLinks(content: string) {
  return parseMarkdownLinks(content).filter((link) =>
    isValidMarkdownHref(link.href.replace(/\s+/g, ""))
  ).length;
}

export function countExternalMarkdownLinks(content: string) {
  return parseMarkdownLinks(content).filter(
    (link) =>
      isValidMarkdownHref(link.href.replace(/\s+/g, "")) &&
      isExternalToolOrOrgLink(link.href.replace(/\s+/g, ""))
  ).length;
}

export function countInternalMarkdownLinks(content: string) {
  return parseMarkdownLinks(content).filter((link) =>
    isInternalSiteLink(link.href.replace(/\s+/g, ""))
  ).length;
}

export function countHeadingSections(content: string) {
  return (content.match(/^##\s+/gm) ?? []).length;
}

export function blocksWithMarkdownLinks(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => /\[[^\]]+]\([^)]+\)/.test(block)).length;
}

export function validateAeoOwnerVoiceContent(content: string) {
  const issues: string[] = [];
  const words = countArticleWords(content);
  const externalLinks = countExternalMarkdownLinks(content);
  const headings = countHeadingSections(content);

  if (words < OWNER_VOICE_WORD_TARGETS.min) {
    issues.push(
      `article too short (${words} words; target ${OWNER_VOICE_WORD_TARGETS.idealMin}-${OWNER_VOICE_WORD_TARGETS.idealMax})`
    );
  }

  if (words > OWNER_VOICE_WORD_TARGETS.max) {
    issues.push(
      `article too long (${words} words; keep under ${OWNER_VOICE_WORD_TARGETS.max})`
    );
  }

  if (!/^##\s+Quick Answer\b/im.test(content)) {
    issues.push("missing ## Quick Answer section for AEO");
  }

  if (headings < 4) {
    issues.push(
      `not enough ## sections (${headings}; need Quick Answer plus 3+ body sections)`
    );
  }

  issues.push(...detectOwnerVoiceLinkFiller(content));

  const brokenLinks = parseMarkdownLinks(content).filter(
    (link) => !isValidMarkdownHref(link.href.replace(/\s+/g, ""))
  );

  if (brokenLinks.length > 0) {
    issues.push(`broken markdown links (${brokenLinks.length})`);
  }

  if (externalLinks < OWNER_VOICE_LINK_TARGETS.minExternal) {
    issues.push(
      `not enough external tool/org links (need at least ${OWNER_VOICE_LINK_TARGETS.minExternal} woven inline)`
    );
  }

  return issues;
}

export function getInlineImageBlockIndices(contentBlocks: string[]) {
  const indices: number[] = [];

  for (const [index, block] of contentBlocks.entries()) {
    if (/^##\s+/i.test(block) && !/^##\s+Quick Answer\b/i.test(block)) {
      indices.push(index);
    }
  }

  return indices;
}

function contentHasHref(content: string, href: string) {
  const normalized = normalizeHref(href.replace(/\s+/g, ""));
  return parseMarkdownLinks(content).some(
    (link) => normalizeHref(link.href.replace(/\s+/g, "")) === normalized
  );
}

function linkFirstBareMention(content: string, phrase: string, href: string) {
  if (contentHasHref(content, href)) {
    return content;
  }

  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  let linked = false;

  return parts
    .map((part) => {
      if (linked || /^\[[^\]]+\]\([^)]+\)$/.test(part)) {
        return part;
      }

      const regex = new RegExp(`\\b(${escapeRegex(phrase)})\\b`, "i");

      if (!regex.test(part)) {
        return part;
      }

      linked = true;
      return part.replace(regex, `[$1](${href})`);
    })
    .join("");
}

function sortedExternalPhraseEntries() {
  return ARTICLE_EXTERNAL_LINK_PHRASES.flatMap((entry) =>
    entry.phrases.map((phrase) => ({
      phrase,
      href: entry.href,
      length: phrase.length
    }))
  ).sort((left, right) => right.length - left.length);
}

export type PolishOwnerVoiceLinksOptions = {
  category?: string;
};

/** Strip filler, fix broken URLs, link bare tool/org mentions inline only (not in Quick Answer). */
export function polishOwnerVoiceLinks(
  content: string,
  _options: PolishOwnerVoiceLinksOptions = {}
) {
  let next = stripOwnerVoiceLinkFiller(content);
  next = fixMalformedMarkdownLinks(next);
  next = stripDuplicateRawUrlAfterMarkdownLink(next);

  const blocks = next
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const polished = blocks.map((block) => {
    if (/^##\s+/i.test(block)) {
      return block;
    }

    let updated = block;

    for (const entry of sortedExternalPhraseEntries()) {
      updated = linkFirstBareMention(updated, entry.phrase, entry.href);
    }

    return updated;
  });

  return stripMarkdownLinksFromHeadings(
    polished.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
  );
}

/** @deprecated Use polishOwnerVoiceLinks — no boilerplate injection. */
export function ensureOwnerVoiceAeoLinks(
  content: string,
  _options: { internalLinks?: Array<{ label: string; href: string }>; category?: string } = {}
) {
  return polishOwnerVoiceLinks(content);
}
