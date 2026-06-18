function normalizeOpening(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(text: string) {
  const match = text.trim().match(/^(.+?[.!?])(\s|$)/);
  return (match?.[1] ?? text.trim().split(/\n/)[0] ?? text).trim();
}

function openingTokens(text: string) {
  return normalizeOpening(firstSentence(text)).split(" ").filter(Boolean);
}

function tokenOverlap(a: string[], b: string[]) {
  const setB = new Set(b);
  const shared = a.filter((token) => setB.has(token)).length;
  const union = new Set([...a, ...b]).size;

  return union === 0 ? 0 : shared / union;
}

export function extractOpeningLine(text: string) {
  return firstSentence(text);
}

export function detectRepetitionWarning(input: {
  linkedin_opening: string;
  instagram_opening: string;
  recent_linkedin_openings: string[];
  recent_instagram_openings: string[];
}) {
  const warnings: string[] = [];
  const linkedinTokens = openingTokens(input.linkedin_opening);
  const instagramTokens = openingTokens(input.instagram_opening);

  for (const previous of input.recent_linkedin_openings) {
    const previousTokens = openingTokens(previous);
    const overlap = tokenOverlap(linkedinTokens, previousTokens);

    if (
      overlap >= 0.72 ||
      normalizeOpening(input.linkedin_opening) === normalizeOpening(previous) ||
      linkedinTokens.slice(0, 3).join(" ") === previousTokens.slice(0, 3).join(" ")
    ) {
      warnings.push("LinkedIn opening resembles a recent draft.");
      break;
    }
  }

  for (const previous of input.recent_instagram_openings) {
    const previousTokens = openingTokens(previous);
    const overlap = tokenOverlap(instagramTokens, previousTokens);

    if (
      overlap >= 0.72 ||
      normalizeOpening(input.instagram_opening) === normalizeOpening(previous) ||
      instagramTokens.slice(0, 3).join(" ") === previousTokens.slice(0, 3).join(" ")
    ) {
      warnings.push("Instagram opening resembles a recent draft.");
      break;
    }
  }

  return warnings.length > 0 ? warnings.join(" ") : null;
}
