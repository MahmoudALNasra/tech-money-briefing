/**
 * Owner-voice authenticity criteria — derived from manual rewrites that scored
 * 100% human on external AI detectors (vs automated pipeline output at ~69%).
 */

/** Instructions passed to owner-voice generation and rewrites. */
export const OWNER_VOICE_AUTHENTICITY_CRITERIA = [
  "Open with a specific lived scenario, mistake, or observation — not a reusable skepticism template like 'I would not treat X like a box to check' or 'I would not treat X like magic.'",
  "Prefer story hooks: something you signed up for, bought, tested, wasted time on, or saw a client do wrong. Name a real situation before giving advice.",
  "Use opinionated section headings tied to the topic — e.g. 'The mistake is turning on AI before you have one real email' — never generic tutorial labels like 'What AI can actually do', 'Regular analysis is crucial', or 'Choosing the right tool matters'.",
  "When comparing tools, give plain when-to-use lines (Mailchimp is fine when…, HubSpot makes more sense when…) — not feature-dump bullets labeled Automation and Personalization.",
  "Do not use colon-then-bullet feature lists (**Automation**: …, **Personalization**: …). Write short standalone paragraphs or dash lines without category labels.",
  "Include at least one specific number, list size, timeframe, or metric when the topic allows (e.g. 400-person list, three subject lines, week one).",
  "Only add internal site links when they fit the topic naturally. Do not force unrelated tool plugs (e.g. Business Data Generator on an email marketing piece).",
  "End on one sharp practical sentence. No recap paragraph, no 'use them wisely and they will serve you well' closer.",
  "Avoid detector magnets: transform, supercharge, enhance effectiveness, provide insights, crucial, personalization (as buzzword), set-and-forget, regular analysis, over-optimizing.",
  "Vary first person: use I/my for judgment, not stacked 'I would check' / 'I would still verify' filler injected to fake burstiness.",
  "key_takeaways should sound like notes you'd leave yourself — specific facts and actions, not corporate KPI language."
];

/** Excerpt from a detector-passed manual rewrite (email marketing + AI). */
export const OWNER_VOICE_AUTHENTICITY_PASSED_EXCERPT = `I signed up for a newsletter last month because the signup page looked clean. The welcome email sounded like it was written for every company on earth — probably because one was.

That is when I started caring about AI in email marketing. Not because AI is useless. Because most people turn it on before they know what the email is supposed to do.

## Quick Answer

Use AI to draft subject lines, shorten text you already wrote, or suggest send times on a list you understand. Do not use it to invent your offer, your tone, or a whole sequence from a blank prompt.

## The mistake is turning on AI before you have one real email

I have seen small shops plug **Mailchimp** or **Klaviyo** into a list of 400 people and ask the tool to personalize everything. The merge tags work. The names show up. The email still reads like it belongs to someone else's business.

Before I touch AI in a campaign, I write one email by hand for one customer type. One problem. One reason to open it. If I cannot do that in ten minutes, AI will only speed up the confusion.

## What I would let AI handle

Subject line variants for an email I already approved — maybe three options, not thirty.

## The number I actually watch

Open rate tells me if the subject line lied. Click rate tells me if the body delivered. Unsubscribes tell me if I should stop sending that angle.

AI dashboards love showing lift percentages. I still pull one campaign, read the email out loud, and ask whether a tired customer would feel tricked. That test beats any score the platform prints.`;

/** Patterns from automated rewrites that failed AI detection — reject and retry. */
export const OWNER_VOICE_TUTORIAL_SKELETON_PATTERNS: RegExp[] = [
  /^##\s+what\s+.+\s+can\s+actually\s+do\b/im,
  /^##\s+regular\s+analysis\s+is\s+crucial\b/im,
  /^##\s+choosing\s+the\s+right\s+tool\s+matters\b/im,
  /^##\s+the\s+mistake\s+most\s+people\s+make\s+here\b/im,
  /\blike a box to check\b/i,
  /\bset-and-forget\b/i,
  /\benhance\s+.+\s+effectiveness\b/i,
  /\bprovide\s+insights\b/i,
  /\bregular\s+analysis\s+and\s+optimization\b/i,
  /\bover-optimiz/i,
  /\bsupercharge\b/i,
  /\b\d+\*\*Automation\*\*/i,
  /\*\*Automation\*\*:/i,
  /\*\*Personalization\*\*:/i,
  /\btransform\s+.+\s+through\s+automation\b/i,
  /\bAI tools can offer remarkable improvements\b/i,
  /\buse them wisely, and they will serve\b/i
];

/** Text injected by automated repair patches — never acceptable in final copy. */
export const OWNER_VOICE_PATCH_INJECTION_PATTERNS: RegExp[] = [
  /\bThat part matters\.\s*\n\nI would check that first\b/i,
  /\bI would still verify this manually, because the dashboard can look clean while the actual workflow stays messy\b/i,
  /^I would not treat .+ like a box to check\./im
];

export function detectTutorialArticleSkeleton(content: string) {
  return OWNER_VOICE_TUTORIAL_SKELETON_PATTERNS.filter((pattern) =>
    pattern.test(content)
  ).map((pattern) => pattern.source);
}

export function detectAutomatedPatchInjection(content: string) {
  return OWNER_VOICE_PATCH_INJECTION_PATTERNS.filter((pattern) =>
    pattern.test(content)
  ).map((pattern) => pattern.source);
}
