import {
  ARTICLE_EDITORIAL_SOURCE_NAME,
  ARTICLE_ORIGINALITY_INSTRUCTIONS,
  OWNER_VOICE_AI_VOCABULARY_AVOID,
  OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
  OWNER_VOICE_APPROVED_SAMPLES,
  OWNER_VOICE_GOLD_ARTICLE_EXCERPT,
  OWNER_VOICE_BANNED_PATTERNS,
  OWNER_VOICE_PASSED_ARTICLE_EXCERPTS,
  OWNER_VOICE_REWRITE_GUIDE,
  OWNER_VOICE_SKIP_SLUGS,
  detectOwnerVoiceTemplateSignals,
  detectCorporateTakeaways,
  detectLowBurstiness,
  detectSelfJustifyingSentences,
  detectSubjectRepetition,
  stripGeneratedSourceFooter
} from "../article-attribution";
import {
  ARTICLE_ADVISORY_SPECIFICITY_INSTRUCTIONS,
  ARTICLE_EVENT_FACT_INSTRUCTIONS,
  ARTICLE_KEY_TAKEAWAY_INSTRUCTIONS,
  ARTICLE_OWNER_VOICE_VARIATION_INSTRUCTIONS,
  ARTICLE_STRUCTURAL_VARIATION_INSTRUCTIONS,
  detectGenericAdviceDensity,
  detectOverusedRhetoricalPattern,
  detectRepetitiveTakeawayPattern,
  detectThinEventCoverage
} from "../article-content-quality";
import {
  detectAutomatedPatchInjection,
  detectTutorialArticleSkeleton,
  OWNER_VOICE_AUTHENTICITY_CRITERIA,
  OWNER_VOICE_AUTHENTICITY_PASSED_EXCERPT
} from "./authenticity";
import {
  detectOwnerVoiceLinkFiller,
  OWNER_VOICE_AEO_GOLD_EXCERPT,
  OWNER_VOICE_AEO_STRUCTURE_RULES,
  OWNER_VOICE_WORD_TARGETS,
  polishOwnerVoiceLinks,
  validateAeoOwnerVoiceContent
} from "./aeo-content";
import { normalizeArticleContent } from "../article-markdown";
import { syncArticleInlineImages } from "../article-inline-images";
import { enrichArticleMedia } from "../article-media";
import { getStaticInternalLinksForText } from "../internal-links";
import { getOpenAIClient } from "../openai";
import {
  cleanOwnerVoiceArticleTitle,
  detectTemplatedOwnerVoiceTitle,
  OWNER_VOICE_TITLE_INSTRUCTIONS
} from "./title-cleanup";
import { revalidateSiteCache } from "../revalidate-site";
import { siteConfig } from "../site";
import { getSupabaseClient } from "../supabase";

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  key_takeaways: string[] | null;
  category: string;
  source_name: string;
  source_url: string;
  updated_at: string;
  status: string;
};

type RewrittenArticle = {
  title: string;
  meta_description: string;
  content: string;
  key_takeaways: string[];
};

type ValidationResult = {
  issues: string[];
  templateIssues: string[];
  takeawayIssues: string[];
  burstinessIssues: string[];
  firstPersonIssues: string[];
  structureIssues: string[];
  aiSignalIssues: string[];
  constructionIssues: string[];
};

type TopicBrief = {
  readerQuestion: string;
  topic: string;
  facts: string[];
  angles: string[];
};

const HARD_BANNED_PHRASES = [
  "sure,",
  "for instance",
  "on the other hand",
  "but it also",
  "that being said",
  "furthermore",
  "moreover",
  "additionally",
  "in essence",
  "at its core",
  "it's worth noting",
  "simply put",
  "in short",
  "to be fair",
  "look,",
  "honestly,",
  "here's the thing",
  "game-changer",
  "leverage",
  "unlock",
  "streamline",
  "robust",
  "seamless",
  "delve",
  "navigating the",
  "let's break it down",
  "let's dive in",
  "before diving in",
  "here's how to",
  "common pitfalls",
  "actionable steps",
  "actionable insights",
  "unique value proposition",
  "solid understanding of",
  "one-size-fits-all",
  "the truth is",
  "big deal",
  "nice-to-have",
  "enter AI",
  "strategic move",
  "transformative",
  "pivotal",
  "bespoke",
  "## FAQ",
  "## Conclusion",
  "## Summary",
  "## Common Pitfalls",
  "final thoughts",
  "in conclusion",
  "in today's fast-paced",
  "whether you are a",
  "identify",
  "utilize",
  "implement",
  "strategies effectively",
  "tailor your",
  "optimize",
  "consider these steps",
  "consider the following",
  "here are some steps",
  "follow these steps",
  "this helps [word] navigate",
  "more effectively",
  "these are the questions",
  "this determines whether",
  "it is important to note",
  "it is worth noting",
  "this ensures that",
  "this allows you to",
  "this makes it easier",
  "by doing this",
  "in order to",
  "when it comes to",
  "as a result of",
  "due to the fact",
  "in the event that",
  "it is essential",
  "it is crucial",
  "plays a crucial role",
  "plays an important role",
  "take the time to",
  "do not hesitate to",
  "can be a good companion",
  "can be an excellent",
  "can be a great",
  "is often touted as",
  "go-to for",
  "off the mark",
  "without falling apart",
  "without sacrificing quality",
  "in a factory setting",
  "crucial in a",
  "which is crucial",
  "they are reliable and efficient",
  "sound appealing",
  "jack-of-all-trades",
  "master of none",
  "these are not just theoretical",
  "the risks are real",
  "and they could outweigh",
  "can go a long way",
  "pull a fast one",
  "on its own devices",
  "to its own devices",
  "without proper guidance",
  "get past writer's block",
  "final drafts",
  "do it better",
  "stand out",
  "get lost",
  "room for growth",
  "differentiate yourself",
  "compelling reason for existing",
  "saturated",
  "compared to specialized",
  "compared to traditional"
];

const HARD_BANNED_PHRASES_PROMPT = `HARD BANNED PHRASES — your output must contain zero of these strings (case-insensitive):
${HARD_BANNED_PHRASES.join(" | ")}

If any of these appear in your output, the article will be automatically rejected. Do not use them as transitions, filler, or section titles.`;

const TAKEAWAY_FORMAT_RULES = `TAKEAWAY FORMAT RULES:
- Exactly 3 takeaways
- Each must summarize one specific point from THIS article (fact, number, tool, decision, or concrete next step)
- Vary structure across the three bullets — do NOT use the same opener pattern for all three
- Do NOT force every takeaway to start with "I would", "Don't", or "Your"
- Do NOT use: identify, leverage, utilize, implement, strategies effectively, tailor your, optimize

Good examples (note varied structure):
- "Google Search Console's URL Inspection tool shows index status per page, not site-wide."
- "Most new sites see first impressions within 1–2 weeks if pages are linked internally."
- "Skip paid indexing services — they do not change how Google crawls your site."`;

const FORMATTING_RULES = `FORMATTING RULES (required for every article):
1. Bold key terms, product names, and critical warnings using **bold**
2. Weave 1–2 external links inline on tool/org names in real sentences — never append 'see X for the official product page' or 'covers the next step' filler
3. Add at most 1–2 internal links only when a TRB tool genuinely fits the same sentence
4. Spread links across ## sections — never dump links only in ## Quick Answer
5. Use ## headings that are specific to the topic — not generic like "## Introduction" or "## Conclusion"
6. Dash bullet lists are allowed; numbered lists are banned
7. Do not end with a summary, FAQ, or conclusion section — end on one sharp practical sentence
8. Target ${OWNER_VOICE_WORD_TARGETS.idealMin}–${OWNER_VOICE_WORD_TARGETS.idealMax} words (${OWNER_VOICE_WORD_TARGETS.min}–${OWNER_VOICE_WORD_TARGETS.max} acceptable). Dense AEO briefs, not padded tutorials.
9. Required structure: opinion hook → ## Quick Answer → 3+ scannable ## body sections with links and bullets between sections
10. Where the article covers sales prospecting, lead generation, finding business contacts, or B2B data — you may include one internal link to [Business Data Generator](https://techrevenuebrief.com/business-data-generator) in addition to external tool links`;

const OWNER_VOICE_RULES = `OWNER VOICE RULES — this is the most important section:
- You are a skeptical operator who has actually used these tools and wasted time on bad ones
- First person (I, my) is fine when it adds judgment — do not force "I would not" into every paragraph
- Open with a topic-specific hook: a fact, mistake, direct answer, or contrarian claim — not the same skepticism template every time
- Use short paragraphs (2–3 sentences max)
- Mix sentence lengths: include at least 2 sentences under 7 words and 1 sentence over 20 words
- Use dash bullets for lists, never numbered steps
- Specific headings only — "## The mistake most people make here" not "## Common Mistakes"
- Name actual tools, metrics, dates, or workflows — no generic advice that fits any headline
- For event stories: include who, what, when, amounts, and status from the topic brief
- End on one short, practical sentence. No "In conclusion", no recap, no FAQ

TITLE RULES (required):
${OWNER_VOICE_TITLE_INSTRUCTIONS.join("\n")}`;

const AI_DETECTION_RULES = `AI DETECTION RULES — these patterns will cause the article to be flagged as AI-generated by detectors. Do not use them under any circumstances:

- Never introduce a list with a colon after an explanation sentence.
  BAD: "Consider these steps: ..."
  GOOD: "I would start with the URL Inspection Tool — not because it guarantees indexing, but because it forces you to think about which pages deserve priority."

- Never write wrap-up sentences that explain what the previous sentence did.
  BAD: "This helps Google's crawlers navigate your site more effectively."
  GOOD: Cut it. The point was already made.

- Never use passive structure to soften a recommendation.
  BAD: "It is important to ensure your pages are well-structured."
  GOOD: "Your pages need to be well-structured. That is not optional."

- Never end a paragraph with a sentence that starts with "This" referring to the paragraph's own advice.
  BAD: "This makes it easier for Google to index your content."
  GOOD: End one sentence earlier.

- Replace any bullet list that follows a colon with a paragraph that uses dashes mid-sentence or just flows as prose.
  BAD: "Improve these things:\n- Internal links\n- Page speed"
  GOOD: "Internal links matter more than most people think. Page speed is the other one I would check first."

- Never open with "sounds like a dream", "I would not trust it blindly", or textbook definitions of the topic.
  BAD: "AI-generated content sounds like a dream for fintech companies..."
  GOOD: "A fintech client published a blog post last quarter that mentioned FDIC coverage we never verified. Legal killed it in one afternoon."

- Never repeat the same compliance advice in the opener and ## Quick Answer — say it once, then move on.

- Never use generic checklist bullets like "Use AI for initial drafts" / "Always involve a human for compliance checks" / "Maintain transparency about AI's role".

- For fintech/compliance topics: name a real regulation, review step, or document (KYC copy, fee disclosure, SOC 2, state money-transmitter wording) — not vague "legal pitfalls".`;

const CONSTRUCTION_RULES = `TWO NEW HARD RULES based on AI detector analysis:

RULE A — Never repeat the same subject in back-to-back sentences.
  BAD: "Versatile robots sound appealing. Versatile robots require reconfiguration. Versatile robots are harder to maintain."
  GOOD: "Versatile robots sound appealing until you are the one scheduling the reconfiguration downtime. Maintenance gets complicated fast, and unlike a dedicated machine, you cannot just swap a part."

RULE B — Never write a sentence that exists only to explain why the previous sentence mattered.
  BAD: "Review the content before publishing. This ensures accuracy and maintains trust with your audience."
  GOOD: "Review it before it goes live. One compliance miss in fintech costs more than the time you saved."

The second sentence should add NEW information, not restate the first sentence's value. If the sentence starts with This/It/That and ends with a benefit, delete it.`;

const OWNER_VOICE_SYSTEM_PROMPT = [
  "You are the owner of Tech Revenue Brief. You write in first person as a skeptical operator who has actually run tools, wasted time, and compared options. You do not write SEO tutorials, corporate blogs, or textbook guides. Return only valid JSON.",
  HARD_BANNED_PHRASES_PROMPT,
  TAKEAWAY_FORMAT_RULES,
  FORMATTING_RULES,
  OWNER_VOICE_RULES,
  AI_DETECTION_RULES,
  CONSTRUCTION_RULES
].join("\n\n");

const MAX_REWRITE_ATTEMPTS = 5;
const TOPIC_BRIEF_MODEL = process.env.OPENAI_TOPIC_BRIEF_MODEL ?? "gpt-4o-mini";
const OWNER_VOICE_REWRITE_MODEL = process.env.OPENAI_REWRITE_MODEL ?? "gpt-4o";

const OWNER_VOICE_BAD_EXAMPLE = `BAD — do not write like this (failed ~69% AI detection):
"I would not treat Using AI Tools for Email Marketing like a box to check."
"That part matters. I would check that first. I would still verify this manually..."
"## What AI can actually do"
"AI tools can enhance email marketing effectiveness through automation and personalization."
"- **Automation**: AI can schedule emails..."
"- **Personalization**: AI excels at customizing content..."
"## Regular analysis is crucial"
"Regular analysis and optimization based on AI insights can lead to improved campaign performance."
"For those diving into sales prospecting, the Business Data Generator might be a useful addition..."
"AI tools can offer remarkable improvements, but they are not magic. Use them wisely..."

Also avoid:
"As a small business owner, you might be wondering how to make the most of AI tools."
"relevant and actionable insights"
"## Common Pitfalls to Avoid"
"## FAQ"
"Let's break it down into actionable steps."`;

function articlePath(article: Pick<ArticleRow, "category" | "slug">) {
  return `/${article.category}/${article.slug}`;
}

function globalPattern(pattern: RegExp) {
  return new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  );
}

function sanitizeSourceTextForBrief(content: string) {
  return OWNER_VOICE_BANNED_PATTERNS.reduce(
    (text, pattern) => text.replace(globalPattern(pattern), " "),
    content
  )
    .replace(/\s{2,}/g, " ")
    .slice(0, 4500);
}

const CLEANUP_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacement: string;
  label: string;
}> = [
  {
    pattern: /can be (a |an )?(excellent|great|good) (companion|tool|solution|option) (to|for)/gi,
    replacement: "works well for",
    label: "can be X for"
  },
  {
    pattern: /can be (a |an )?(excellent|great|good)\b/gi,
    replacement: "can be useful",
    label: "can be excellent/great/good"
  },
  {
    pattern: /is often touted as (the |a )?go-to for/gi,
    replacement: "gets recommended for",
    label: "is often touted as go-to"
  },
  { pattern: /is often touted as/gi, replacement: "often gets sold as", label: "is often touted as" },
  { pattern: /go-to for/gi, replacement: "common choice for", label: "go-to for" },
  { pattern: /off the mark/gi, replacement: "wrong", label: "off the mark" },
  {
    pattern: /without proper guidance/gi,
    replacement: "if you are not careful",
    label: "without proper guidance"
  },
  { pattern: /can go a long way/gi, replacement: "actually works", label: "can go a long way" },
  {
    pattern: /these are not just theoretical (concerns|risks)/gi,
    replacement: "this is real",
    label: "not theoretical"
  },
  {
    pattern: /the risks are real, and they could/gi,
    replacement: "the risks",
    label: "the risks are real"
  },
  { pattern: /and they could outweigh/gi, replacement: "and can outweigh", label: "and they could outweigh" },
  { pattern: /in a factory setting/gi, replacement: "on the factory floor", label: "factory setting" },
  { pattern: /crucial in a/gi, replacement: "important in a", label: "crucial in a" },
  { pattern: /which is crucial/gi, replacement: "which matters", label: "which is crucial" },
  {
    pattern: /which is crucial in a \w+ setting/gi,
    replacement: "",
    label: "which is crucial in setting"
  },
  {
    pattern: /they are reliable and efficient/gi,
    replacement: "",
    label: "reliable and efficient"
  },
  {
    pattern: /jack-of-all-trades and master of none/gi,
    replacement: "a generalist that underperforms at everything",
    label: "jack-of-all-trades"
  },
  { pattern: /to its own devices/gi, replacement: "without oversight", label: "to its own devices" },
  { pattern: /on its own devices/gi, replacement: "without oversight", label: "on its own devices" },
  { pattern: /left to run unchecked/gi, replacement: "running without review", label: "unchecked" },
  { pattern: /without sacrificing quality/gi, replacement: "while keeping the work clean", label: "without sacrificing quality" },
  { pattern: /without falling apart/gi, replacement: "without breaking", label: "without falling apart" },
  { pattern: /sound appealing/gi, replacement: "look useful", label: "sound appealing" },
  { pattern: /pull a fast one/gi, replacement: "hide the real issue", label: "pull a fast one" },
  { pattern: /get past writer['']s block/gi, replacement: "get unstuck", label: "writer's block" },
  { pattern: /final drafts/gi, replacement: "publishable drafts", label: "final drafts" },
  { pattern: /do it better/gi, replacement: "improve the work", label: "do it better" },
  { pattern: /stand out/gi, replacement: "look different", label: "stand out" },
  { pattern: /get lost/gi, replacement: "blend in", label: "get lost" },
  { pattern: /room for growth/gi, replacement: "more work to do", label: "room for growth" },
  { pattern: /differentiate yourself/gi, replacement: "show why you are different", label: "differentiate yourself" },
  { pattern: /compelling reason for existing/gi, replacement: "clear reason to exist", label: "reason for existing" },
  { pattern: /\bsaturated\b/gi, replacement: "crowded", label: "saturated" },
  { pattern: /compared to specialized/gi, replacement: "next to dedicated", label: "compared to specialized" },
  { pattern: /compared to traditional/gi, replacement: "next to older", label: "compared to traditional" },
  {
    pattern: /consider these steps[:\s]*/gi,
    replacement: "here is what I would do — ",
    label: "consider these steps"
  },
  { pattern: /consider the following[:\s]*/gi, replacement: "", label: "consider the following" },
  { pattern: /here are some steps[:\s]*/gi, replacement: "I would do this — ", label: "here are some steps" },
  { pattern: /follow these steps[:\s]*/gi, replacement: "I would do this — ", label: "follow these steps" },
  { pattern: /\bsure,/gi, replacement: "Yes, but", label: "sure," },
  { pattern: /\bfor instance\b/gi, replacement: "like", label: "for instance" },
  { pattern: /\bon the other hand\b/gi, replacement: "but", label: "on the other hand" },
  { pattern: /\bthat being said\b/gi, replacement: "", label: "that being said" },
  { pattern: /\bfurthermore\b/gi, replacement: "also", label: "furthermore" },
  { pattern: /\bmoreover\b/gi, replacement: "and", label: "moreover" },
  { pattern: /\badditionally\b/gi, replacement: "also", label: "additionally" },
  { pattern: /\bas a result of\b/gi, replacement: "because of", label: "as a result of" },
  { pattern: /\bas a result\b(?!\s+of)/gi, replacement: "so", label: "as a result" },
  { pattern: /\bas we['']ve seen\b/gi, replacement: "", label: "as we've seen" },
  { pattern: /\bas mentioned\b/gi, replacement: "", label: "as mentioned" },
  { pattern: /\bas noted above\b/gi, replacement: "", label: "as noted above" },
  { pattern: /\bin order to\b/gi, replacement: "to", label: "in order to" },
  { pattern: /\bwhen it comes to\b/gi, replacement: "with", label: "when it comes to" },
  { pattern: /\bdue to the fact\b/gi, replacement: "because", label: "due to the fact" },
  { pattern: /\bin the event that\b/gi, replacement: "if", label: "in the event that" },
  { pattern: /\bby doing this\b/gi, replacement: "", label: "by doing this" },
  { pattern: /\bmore effectively\b/gi, replacement: "better", label: "more effectively" },
  { pattern: /\bin essence\b/gi, replacement: "basically", label: "in essence" },
  { pattern: /\bat its core\b/gi, replacement: "really", label: "at its core" },
  { pattern: /\bit is important to note\b/gi, replacement: "note:", label: "it is important to note" },
  { pattern: /\bit is worth noting\b/gi, replacement: "note:", label: "it is worth noting" },
  { pattern: /\bit is essential\b/gi, replacement: "you need to", label: "it is essential" },
  { pattern: /\bit is crucial\b/gi, replacement: "this is important —", label: "it is crucial" },
  { pattern: /\bit['']s worth noting\b/gi, replacement: "note:", label: "it's worth noting" },
  { pattern: /\bsimply put\b/gi, replacement: "", label: "simply put" },
  { pattern: /\bin short\b/gi, replacement: "", label: "in short" },
  { pattern: /\bto be fair\b/gi, replacement: "", label: "to be fair" },
  { pattern: /\bthe bottom line\b/gi, replacement: "my read", label: "the bottom line" },
  { pattern: /\btake note\b/gi, replacement: "watch this", label: "take note" },
  { pattern: /\bthe reality is\b/gi, replacement: "what tends to happen is", label: "the reality is" },
  { pattern: /\btruth be told\b/gi, replacement: "", label: "truth be told" },
  { pattern: /\bneedless to say\b/gi, replacement: "", label: "needless to say" },
  { pattern: /\bnot surprisingly\b/gi, replacement: "", label: "not surprisingly" },
  { pattern: /\bas you might expect\b/gi, replacement: "", label: "as you might expect" },
  { pattern: /\bit goes without saying\b/gi, replacement: "", label: "it goes without saying" },
  { pattern: /\bworth mentioning\b/gi, replacement: "worth checking", label: "worth mentioning" },
  { pattern: /\bdon['']t forget that\b/gi, replacement: "remember:", label: "don't forget that" },
  { pattern: /\bkeep in mind that\b/gi, replacement: "remember:", label: "keep in mind that" },
  { pattern: /\btake the time to\b/gi, replacement: "", label: "take the time to" },
  { pattern: /\bdo not hesitate to\b/gi, replacement: "", label: "do not hesitate to" },
  { pattern: /\bcircle back\b/gi, replacement: "return", label: "circle back" },
  { pattern: /\btouch base\b/gi, replacement: "talk", label: "touch base" },
  { pattern: /\bmoving forward\b/gi, replacement: "next", label: "moving forward" },
  { pattern: /\bgoing forward\b/gi, replacement: "next", label: "going forward" },
  { pattern: /\bhonestly,/gi, replacement: "", label: "honestly," },
  { pattern: /\bhere['']s the thing\b/gi, replacement: "", label: "here's the thing" },
  { pattern: /\blook,/gi, replacement: "", label: "look," },
  { pattern: /\bwhat actually\b/gi, replacement: "what", label: "what actually" },
  { pattern: /\bgame[- ]changer\b/gi, replacement: "useful shift", label: "game-changer" },
  { pattern: /\bleverag(e|ing)\b/gi, replacement: "use", label: "leverage" },
  { pattern: /\bunlock(ing)?\b/gi, replacement: "open up", label: "unlock" },
  { pattern: /\bstreamline\b/gi, replacement: "simplify", label: "streamline" },
  { pattern: /\brobust\b/gi, replacement: "solid", label: "robust" },
  { pattern: /\bseamless\b/gi, replacement: "smooth", label: "seamless" },
  { pattern: /\bdelve\b/gi, replacement: "get into", label: "delve" },
  { pattern: /\bnavigating the\b/gi, replacement: "understanding the", label: "navigating the" },
  { pattern: /\btransformative\b/gi, replacement: "significant", label: "transformative" },
  { pattern: /\bpivotal\b/gi, replacement: "important", label: "pivotal" },
  { pattern: /\bbespoke\b/gi, replacement: "custom", label: "bespoke" },
  { pattern: /\bstrategic move\b/gi, replacement: "decision", label: "strategic move" },
  { pattern: /\blet['']s dive in\b\.?/gi, replacement: "", label: "let's dive in" },
  { pattern: /\blet['']s break it down\b\.?/gi, replacement: "", label: "let's break it down" },
  { pattern: /\bbefore diving in\b/gi, replacement: "", label: "before diving in" },
  { pattern: /\bhere['']s how to\b/gi, replacement: "how to", label: "here's how to" },
  { pattern: /\bin conclusion\b[,.]?/gi, replacement: "", label: "in conclusion" },
  { pattern: /\bin the end\b/gi, replacement: "after that", label: "in the end" },
  { pattern: /\bultimately\b/gi, replacement: "later", label: "ultimately" },
  { pattern: /\bfinal thoughts\b:?/gi, replacement: "", label: "final thoughts" },
  {
    pattern: /^##\s+(FAQ|Conclusion|Summary|Common Pitfalls|Final Thoughts)\s*$/gim,
    replacement: "## More on this",
    label: "generic section heading"
  },
  {
    pattern: /\bunique value proposition\b/gi,
    replacement: "what makes it different",
    label: "unique value proposition"
  },
  { pattern: /\bactionable insights?\b/gi, replacement: "useful data", label: "actionable insights" },
  {
    pattern: /\bsolid understanding of\b/gi,
    replacement: "good grasp of",
    label: "solid understanding of"
  },
  {
    pattern: /\bone[- ]size[- ]fits[- ]all\b/gi,
    replacement: "generic solution",
    label: "one-size-fits-all"
  },
  {
    pattern: /\bthe truth is\b/gi,
    replacement: "Usually",
    label: "the truth is"
  },
  { pattern: /\bthis helps \w+ navigate\b/gi, replacement: "that helps people read", label: "this helps [word] navigate" },
  { pattern: /\bthese are the questions\b/gi, replacement: "I would ask these questions", label: "these are the questions" },
  { pattern: /\bthis determines whether\b/gi, replacement: "this decides whether", label: "this determines whether" },
  { pattern: /\bthis ensures that\b/gi, replacement: "this means", label: "this ensures that" },
  { pattern: /\bthis allows you to\b/gi, replacement: "so you can", label: "this allows you to" },
  { pattern: /\bthis makes it easier\b/gi, replacement: "the job gets simpler", label: "this makes it easier" },
  { pattern: /\bplays a crucial role\b/gi, replacement: "matters a lot", label: "plays a crucial role" },
  { pattern: /\bplays an important role\b/gi, replacement: "matters", label: "plays an important role" },
  { pattern: /\bbig deal\b/gi, replacement: "important", label: "big deal" },
  { pattern: /\bnice-to-have\b/gi, replacement: "optional", label: "nice-to-have" },
  { pattern: /\bit['']s not just about\b/gi, replacement: "it is not only", label: "it's not just about" },
  { pattern: /\bbut it also\b/gi, replacement: "and it", label: "but it also" },
  { pattern: /\boffer insights\b/gi, replacement: "share useful notes", label: "offer insights" },
  { pattern: /\btrip up\b/gi, replacement: "slow you down", label: "trip up" },
  { pattern: /\brisk management\b/gi, replacement: "risk checks", label: "risk management" },
  { pattern: /\bnavigate the\b/gi, replacement: "understand the", label: "navigate the" },
  { pattern: /\bidentify\b/gi, replacement: "find", label: "identify" },
  { pattern: /\butilize\b/gi, replacement: "use", label: "utilize" },
  { pattern: /\bimplement\b/gi, replacement: "use", label: "implement" },
  { pattern: /\bstrategies effectively\b/gi, replacement: "the thing that matters", label: "strategies effectively" },
  { pattern: /\btailor your\b/gi, replacement: "adjust your", label: "tailor your" },
  { pattern: /\boptimize\b/gi, replacement: "improve", label: "optimize" },
  { pattern: /\bwhether you are a\b[^.]+?(or a\b[^.]+)?/gi, replacement: "", label: "whether you are a" },
  { pattern: /in today['']s fast-paced[^,.]*/gi, replacement: "", label: "in today's fast-paced" },
  { pattern: /^\s*\d+\.\s+/gm, replacement: "- ", label: "numbered list" },
  { pattern: /^\s*\[\s*\]\s+/gm, replacement: "- ", label: "checkbox list" },
  { pattern: /^\s*\[x\]\s+/gim, replacement: "- ", label: "checked list" }
];

const AI_SIGNAL_PATTERNS: RegExp[] = [
  /consider (these|the following)/i,
  /this (helps|allows|ensures|makes it)/i,
  /plays a (crucial|important|key) role/i,
  /it is (important|essential|crucial|worth)/i,
  /more effectively/i,
  /\w+ing your \w+ (more )?(effectively|efficiently)/i,
  /these are the (steps|questions|factors)/i,
  /can be (a |an )?(excellent|great|good) (companion|tool|solution|option) (to|for)/i,
  /(This|It|That) (means|makes|helps|allows|ensures|shows|demonstrates|proves|can|will|would) (it |you |your |the )/i,
  /^##\s+.+\s+(compared to|vs)\s+.+$/im,
  /:\n[-•*]/
];

function scanAiSignalPatterns(body: string) {
  return AI_SIGNAL_PATTERNS.filter((pattern) => pattern.test(body)).map((pattern) =>
    pattern.toString()
  );
}

function warnAiSignals(slug: string, attempt: number, phase: string, body: string) {
  const signals = scanAiSignalPatterns(body);

  for (const signal of signals) {
    console.warn(`[AI-SIGNAL] ${slug} attempt ${attempt} ${phase}: ${signal}`);
  }

  return signals;
}

function cleanupText(text: string) {
  const triggered: string[] = [];
  let cleaned = text;

  for (const replacement of CLEANUP_REPLACEMENTS) {
    replacement.pattern.lastIndex = 0;
    if (replacement.pattern.test(cleaned)) {
      triggered.push(replacement.label);
      replacement.pattern.lastIndex = 0;
      cleaned = cleaned.replace(replacement.pattern, replacement.replacement);
    }
  }

  const beforeSelfJustifyCleanup = cleaned;
  cleaned = cleaned
    .replace(
      /([.!?]\s+)(This|It|That) (means|makes|helps|allows|ensures|shows|demonstrates|proves|can|will|would) (it |you |your |the )[^.!?]*[.!?]/gi,
      "$1"
    )
    .replace(/:\n(?=[-•*])/g, ".\n");

  if (cleaned !== beforeSelfJustifyCleanup) {
    triggered.push("self-justify sentence");
  }

  return {
    text: cleaned.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    triggered
  };
}

function cleanupTakeaway(takeaway: string) {
  const { text } = cleanupText(takeaway);

  return text
    .replace(/\bidentify\b/gi, "find")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bimplement\b/gi, "use")
    .replace(/\bstrategies effectively\b/gi, "the thing that matters")
    .replace(/\btailor your\b/gi, "adjust your")
    .replace(/\boptimize\b/gi, "improve")
    .trim();
}

function cleanupTitle(title: string) {
  const { text, triggered } = cleanupText(title);
  const normalized = cleanOwnerVoiceArticleTitle(text).cleaned;

  return {
    text: normalized,
    triggered: [
      ...triggered,
      ...(normalized !== text ? ["templated title suffix"] : [])
    ]
  };
}

function cleanupRewrittenDraft(
  draft: RewrittenArticle,
  article: Pick<ArticleRow, "slug" | "category">,
  attempt: number,
  phase: string
): RewrittenArticle {
  const content = cleanupText(draft.content);
  const title = cleanupTitle(draft.title);
  const meta = cleanupText(draft.meta_description);
  const keyTakeaways = draft.key_takeaways.map(cleanupTakeaway).slice(0, 3);
  const triggered = [...content.triggered, ...title.triggered, ...meta.triggered];
  let contentText = content.text;

  if (!article.category?.includes("comparison")) {
    const beforeHeadingCleanup = contentText;
    contentText = contentText
      .replace(/^## .+ compared to .+$/gim, "")
      .replace(/^## .+\s+vs\s+.+$/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (contentText !== beforeHeadingCleanup) {
      triggered.push("comparison heading");
    }
  }

  if (triggered.length > 0) {
    console.log(
      `[owner-voice] ${article.slug} attempt ${attempt} ${phase} cleanup: ${[...new Set(triggered)].join(", ")}`
    );
  }

  warnAiSignals(article.slug, attempt, phase, contentText);

  return {
    title: title.text,
    meta_description: meta.text.slice(0, 180),
    content: normalizeArticleContent(stripGeneratedSourceFooter(contentText)),
    key_takeaways: keyTakeaways
  };
}

async function loadArticles(options: {
  limit?: number;
  category?: string;
  slug?: string;
  since?: string;
  onlyOthers: boolean;
  fetchAll: boolean;
  bulkTouchedOnly: boolean;
  includeDrafts: boolean;
  includeSkipped?: boolean;
  skipSlugs?: string[];
}) {
  const supabase = getSupabaseClient();
  const pageSize = 100;
  const maxTotal = options.fetchAll
    ? Number.MAX_SAFE_INTEGER
    : (options.limit ?? 5);
  const rows: ArticleRow[] = [];
  let offset = 0;

  while (rows.length < maxTotal) {
    const rangeEnd = offset + pageSize - 1;
    let query = supabase
      .from("articles")
      .select(
        "id,title,slug,meta_description,content,key_takeaways,category,source_name,source_url,updated_at,status"
      )
      .not("source_name", "ilike", "%Referral%")
      .order("published_at", { ascending: false })
      .range(offset, rangeEnd);

    if (options.includeDrafts) {
      query = query.in("status", ["published", "draft"]);
    } else {
      query = query.eq("status", "published");
    }

    if (options.onlyOthers) {
      query = query.eq("category", "others");
    } else {
      query = query.neq("category", "others");
    }

    if (options.category) {
      query = query.eq("category", options.category);
    }

    if (options.slug) {
      query = query.eq("slug", options.slug);
    }

    if (options.since) {
      query = query.gte("published_at", options.since);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load articles: ${error.message}`);
    }

    const page = (data ?? []) as ArticleRow[];
    if (page.length === 0) {
      break;
    }

    rows.push(...page);
    offset += pageSize;

    if (page.length < pageSize) {
      break;
    }
  }

  return rows
    .filter((article) =>
      options.skipSlugs?.includes(article.slug) ? false : true
    )
    .filter((article) =>
      options.includeSkipped
        ? true
        : !OWNER_VOICE_SKIP_SLUGS.includes(article.slug)
    )
    .filter((article) => {
      if (!options.bulkTouchedOnly) {
        return true;
      }

      const hasEditorialSource =
        article.source_name === ARTICLE_EDITORIAL_SOURCE_NAME;
      const updatedRecently =
        Date.now() - new Date(article.updated_at).getTime() < 48 * 60 * 60 * 1000;
      return hasEditorialSource && updatedRecently;
    })
    .slice(0, maxTotal);
}

async function extractTopicBrief(article: ArticleRow): Promise<TopicBrief> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: TOPIC_BRIEF_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "article_topic_brief",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            readerQuestion: { type: "string" },
            topic: { type: "string" },
            facts: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: { type: "string" }
            },
            angles: {
              type: "array",
              minItems: 2,
              maxItems: 4,
              items: { type: "string" }
            }
          },
          required: ["readerQuestion", "topic", "facts", "angles"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "Extract the topic, reader question, verifiable facts, and angles from an article. Facts must be concrete (names, dates, amounts, charges, status) when present in the source. Ignore the old writing style, headings, and structure. If the source is thin on facts, return only what is actually stated — do not invent details."
      },
      {
        role: "user",
        content: JSON.stringify({
          title: article.title,
          category: article.category,
          meta_description: article.meta_description,
          key_takeaways: article.key_takeaways ?? [],
          content: sanitizeSourceTextForBrief(article.content)
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error(`Topic brief empty for ${article.slug}`);
  }

  return JSON.parse(raw) as TopicBrief;
}

async function writeOwnerVoiceArticle(
  article: ArticleRow,
  brief: TopicBrief,
  internalLinks: Array<{ label: string; href: string }>,
  attempt: number,
  retryFeedback?: string[]
): Promise<RewrittenArticle> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: OWNER_VOICE_REWRITE_MODEL,
    temperature: rewriteTemperatureForAttempt(attempt),
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "owner_voice_article_rewrite",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            meta_description: { type: "string" },
            content: { type: "string" },
            key_takeaways: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            }
          },
          required: ["title", "meta_description", "content", "key_takeaways"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content: OWNER_VOICE_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Write a brand-new Tech Revenue Brief article from scratch in the owner voice.",
          goldStandardExcerpt: OWNER_VOICE_GOLD_ARTICLE_EXCERPT,
          aeoGoldExcerpt: OWNER_VOICE_AEO_GOLD_EXCERPT,
          detectorPassedExcerpts: [
            ...OWNER_VOICE_PASSED_ARTICLE_EXCERPTS,
            OWNER_VOICE_AUTHENTICITY_PASSED_EXCERPT,
            OWNER_VOICE_AEO_GOLD_EXCERPT
          ],
          aiVocabularyToAvoid: OWNER_VOICE_AI_VOCABULARY_AVOID,
          badExampleToAvoid: OWNER_VOICE_BAD_EXAMPLE,
          approvedVoiceSamples: OWNER_VOICE_APPROVED_SAMPLES,
          retryFeedback:
            retryFeedback && retryFeedback.length > 0
              ? `Your last draft failed checks. Fix these issues: ${retryFeedback.join("; ")}`
              : undefined,
          rules: [
            ...ARTICLE_ORIGINALITY_INSTRUCTIONS,
            ...OWNER_VOICE_REWRITE_GUIDE,
            ...OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
            ...OWNER_VOICE_AUTHENTICITY_CRITERIA,
            ...OWNER_VOICE_AEO_STRUCTURE_RULES,
            ...ARTICLE_KEY_TAKEAWAY_INSTRUCTIONS,
            ...ARTICLE_EVENT_FACT_INSTRUCTIONS,
            ...ARTICLE_ADVISORY_SPECIFICITY_INSTRUCTIONS,
            ...ARTICLE_STRUCTURAL_VARIATION_INSTRUCTIONS,
            ...ARTICLE_OWNER_VOICE_VARIATION_INSTRUCTIONS,
            HARD_BANNED_PHRASES_PROMPT,
            TAKEAWAY_FORMAT_RULES,
            FORMATTING_RULES,
            OWNER_VOICE_RULES,
            AI_DETECTION_RULES,
            CONSTRUCTION_RULES,
            "Never use words or phrases listed in aiVocabularyToAvoid unless quoting someone.",
            "Match the goldStandardExcerpt: skeptical first-person opener, plain reasoning, specific ## headings, short paragraphs, opinionated lists — not a tutorial.",
            "Match aeoGoldExcerpt: skeptical opener, ## Quick Answer, short scannable ## sections, dash lists, links in different sections, 300–400 words, sharp closer.",
            "Match detectorPassedExcerpts — especially the email-marketing and Claude vs ChatGPT excerpts.",
            "Read badExampleToAvoid and do not produce anything structurally or tonally similar.",
            "Do not try to sound human by using 'sure,' 'the truth is,' 'some kind of oracle,' analogies like darts/bullseyes, or polished transition phrases.",
            "Use the topicBrief.facts array in the article body — especially for news, legal, funding, and layoff topics.",
            "Avoid neat article endings. No summary section, no conclusion, no final lesson, no recap paragraph.",
            "Avoid business-school language: value proposition, segmentation matters, perceived value, operational costs, actionable insights, tailored strategies, customer needs and budgets.",
            "If you want to warn the reader, use a specific heading like '## The mistake is asking ChatGPT with no context' — never 'Common Pitfalls' or 'FAQ'.",
            "Use dash bullet lists or short paragraphs only. Never use numbered lists like '1.' or '2.' anywhere in the article.",
            "Do not end with 'Final Thoughts', 'In conclusion', '## Conclusion', '## Takeaway', or any recap section. End on one sharp practical sentence.",
            "Use the topicBrief only for meaning. Do not reuse the old article's structure, headings, or phrasing.",
            "Write ${OWNER_VOICE_WORD_TARGETS.idealMin}-${OWNER_VOICE_WORD_TARGETS.idealMax} words in markdown. No H1.",
            "Always include ## Quick Answer plus at least three more ## sections. Do not add ## FAQ.",
            "Do not use numbered step lists (1. 2. 3.) or checkbox checklists.",
            "Use external links inline on product names in real sentences — never append boilerplate like 'covers the next step' or 'official product page'.",
            "Add internal links only when they fit naturally in the same sentence as your advice.",
            "key_takeaways must summarize specific points from this article, not a fixed three-clause formula.",
            "Title should sound like something a real person would click, not a keyword-stuffed SEO title.",
            ...OWNER_VOICE_TITLE_INSTRUCTIONS
          ],
          topicBrief: brief,
          slug: article.slug,
          category: article.category,
          availableInternalLinks: internalLinks
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error(`OpenAI returned empty content for ${article.slug}`);
  }

  const parsed = JSON.parse(raw) as RewrittenArticle;

  if (
    !parsed.title ||
    !parsed.meta_description ||
    !parsed.content ||
    !Array.isArray(parsed.key_takeaways) ||
    parsed.key_takeaways.length !== 3
  ) {
    throw new Error(`Rewrite response missed fields for ${article.slug}`);
  }

  return {
    title: parsed.title.trim(),
    meta_description: parsed.meta_description.trim().slice(0, 180),
    content: normalizeArticleContent(stripGeneratedSourceFooter(parsed.content)),
    key_takeaways: parsed.key_takeaways.map((takeaway) => takeaway.trim()).slice(0, 3)
  };
}

function rewriteTemperatureForAttempt(attempt: number) {
  if (attempt <= 1) {
    return 0.5;
  }

  if (attempt === 2) {
    return 0.45;
  }

  return 0.4;
}

async function rewriteTakeawaysOnly(
  article: ArticleRow,
  brief: TopicBrief,
  draft: RewrittenArticle,
  issues: string[]
) {
  const completion = await getOpenAIClient().chat.completions.create({
    model: OWNER_VOICE_REWRITE_MODEL,
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "owner_voice_takeaway_repair",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            key_takeaways: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            }
          },
          required: ["key_takeaways"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content: [
          "Return only valid JSON. Rewrite only the key_takeaways. Do not rewrite the article body.",
          HARD_BANNED_PHRASES_PROMPT,
          TAKEAWAY_FORMAT_RULES
        ].join("\n\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          title: draft.title,
          slug: article.slug,
          topicBrief: brief,
          failedChecks: issues,
          articleExcerpt: draft.content.slice(0, 2500),
          currentTakeaways: draft.key_takeaways
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error(`Takeaway repair empty for ${article.slug}`);
  }

  const parsed = JSON.parse(raw) as { key_takeaways?: unknown };
  if (!Array.isArray(parsed.key_takeaways) || parsed.key_takeaways.length !== 3) {
    throw new Error(`Takeaway repair missed fields for ${article.slug}`);
  }

  return parsed.key_takeaways.map((takeaway) =>
    cleanupTakeaway(String(takeaway).trim())
  );
}

function validateOwnerVoiceDraft(
  draft: RewrittenArticle,
  title: string
): ValidationResult {
  const templateIssues = detectOwnerVoiceTemplateSignals(draft.content);
  const titleIssues = detectTemplatedOwnerVoiceTitle(draft.title);
  const takeawayIssues = [
    ...detectCorporateTakeaways(draft.key_takeaways),
    ...detectRepetitiveTakeawayPattern(draft.key_takeaways)
  ];
  const burstinessIssues = detectLowBurstiness(draft.content);
  const constructionIssues = [
    ...detectSubjectRepetition(draft.content),
    ...detectSelfJustifyingSentences(draft.content),
    ...detectOverusedRhetoricalPattern(draft.content),
    ...detectThinEventCoverage(title, draft.content),
    ...detectGenericAdviceDensity(draft.content),
    ...detectTutorialArticleSkeleton(draft.content).map(
      (pattern) => `tutorial skeleton detected: ${pattern}`
    ),
    ...detectAutomatedPatchInjection(draft.content).map(
      (pattern) => `automated patch injection: ${pattern}`
    ),
    ...detectOwnerVoiceLinkFiller(draft.content)
  ];
  const aiSignals = scanAiSignalPatterns(draft.content);
  const aiSignalIssues =
    aiSignals.length > 3
      ? [
          `too many AI-signal patterns after cleanup (${aiSignals.length}): ${aiSignals.join(", ")}`
        ]
      : [];
  const firstPersonIssues: string[] = [];
  const structureIssues: string[] = [];

  const firstPersonCount = (
    draft.content.match(/\bI\b|\bmy\b|\bI would\b|\bI would not\b|\bI wouldn't\b/gi) ?? []
  ).length;
  if (firstPersonCount < 1) {
    firstPersonIssues.push("not enough first-person voice (I/my)");
  }

  if (draft.content.length < 400) {
    structureIssues.push("article body too thin (characters)");
  }

  structureIssues.push(...validateAeoOwnerVoiceContent(draft.content));

  if (/\bwe would\b/i.test(draft.content)) {
    structureIssues.push("corporate 'we would' voice instead of owner 'I'");
  }

  if (/^\s*\d+\.\s/m.test(draft.content)) {
    structureIssues.push("numbered list detected");
  }

  const issues = [
    ...titleIssues,
    ...templateIssues,
    ...takeawayIssues,
    ...burstinessIssues,
    ...constructionIssues,
    ...firstPersonIssues,
    ...structureIssues,
    ...aiSignalIssues
  ];

  return {
    issues,
    templateIssues,
    takeawayIssues,
    burstinessIssues,
    constructionIssues,
    firstPersonIssues,
    structureIssues,
    aiSignalIssues
  };
}

function sentenceExamplesForRetry(content: string, limit = 4) {
  const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [];
  const examples = new Set<string>();
  const selfJustifyPattern =
    /^(This|It|That) (means|makes|helps|allows|ensures|shows|demonstrates|proves|can|will|would) (it |you |your |the )/i;

  for (let i = 1; i < sentences.length && examples.size < limit; i += 1) {
    const prev = sentences[i - 1]?.trim();
    const curr = sentences[i]?.trim();
    const prevFirstWord = prev?.split(/\s+/)[0]?.toLowerCase();
    const currFirstWord = curr?.split(/\s+/)[0]?.toLowerCase();

    if (
      prev &&
      curr &&
      prevFirstWord &&
      currFirstWord &&
      prevFirstWord === currFirstWord &&
      prevFirstWord.length > 3
    ) {
      examples.add(`${prev} ${curr}`);
    }

    if (curr && selfJustifyPattern.test(curr)) {
      examples.add(curr);
    }
  }

  for (const pattern of OWNER_VOICE_BANNED_PATTERNS) {
    if (examples.size >= limit) {
      break;
    }

    const sentence = sentences.find((item) => pattern.test(item));
    if (sentence) {
      examples.add(sentence.trim());
    }
  }

  return [...examples].slice(0, limit);
}

async function repairDraft(
  article: ArticleRow,
  brief: TopicBrief,
  draft: RewrittenArticle,
  validation: ValidationResult,
  attempt: number
) {
  let repaired = draft;

  if (validation.takeawayIssues.length > 0) {
    console.log(`[owner-voice] ${article.slug} attempt ${attempt} repairing takeaways`);
    repaired = {
      ...repaired,
      key_takeaways: await rewriteTakeawaysOnly(
        article,
        brief,
        repaired,
        validation.takeawayIssues
      )
    };
  }

  return cleanupRewrittenDraft(repaired, article, attempt, "repair");
}

async function rewriteArticle(article: ArticleRow): Promise<RewrittenArticle> {
  const internalLinks = getStaticInternalLinksForText(
    [article.title, article.meta_description, article.category, article.content]
      .join(" ")
      .slice(0, 5000),
    5
  ).map((link) => ({
    label: link.label,
    href: link.href
  }));

  const brief = await extractTopicBrief(article);
  let lastIssues: string[] = [];
  let draft: RewrittenArticle | undefined;

  for (let attempt = 1; attempt <= MAX_REWRITE_ATTEMPTS; attempt += 1) {
    draft = await writeOwnerVoiceArticle(
      article,
      brief,
      internalLinks,
      attempt,
      attempt > 1 ? lastIssues : undefined
    );
    draft = cleanupRewrittenDraft(draft, article, attempt, "generation");
    draft = {
      ...draft,
      content: polishOwnerVoiceLinks(draft.content, {
        category: article.category
      })
    };
    let validation = validateOwnerVoiceDraft(draft, article.title);

    if (validation.issues.length > 0) {
      draft = await repairDraft(article, brief, draft, validation, attempt);
      draft = {
        ...draft,
        content: polishOwnerVoiceLinks(draft.content, {
          category: article.category
        })
      };
      validation = validateOwnerVoiceDraft(draft, article.title);
    }

    const failedSentenceExamples =
      attempt >= 2 ? sentenceExamplesForRetry(draft.content) : [];
    lastIssues = [
      ...validation.issues,
      ...failedSentenceExamples.map(
        (example) => `Do not write this AI-flagged sentence: "${example}"`
      )
    ];

    if (validation.issues.length === 0) {
      return draft;
    }

    console.warn(
      `[owner-voice] ${article.slug} attempt ${attempt} failed checks: ${lastIssues.join(", ")}`
    );
  }

  if (!draft) {
    throw new Error(`Rewrite failed for ${article.slug}`);
  }

  throw new Error(
    `Rewrite for ${article.slug} failed validation after ${MAX_REWRITE_ATTEMPTS} attempts: ${lastIssues.join(", ")}`
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type OwnerVoiceRewriteOptions = {
  limit?: number;
  all?: boolean;
  category?: string;
  slug?: string;
  since?: string;
  dryRun?: boolean;
  draftOnFail?: boolean;
  onlyOthers?: boolean;
  bulkTouchedOnly?: boolean;
  includeDrafts?: boolean;
  includeSkipped?: boolean;
  skipSlugs?: string[];
  delayMs?: number;
};

export type OwnerVoiceRewriteResult = {
  checked: number;
  updated: number;
  drafted: number;
  dryRun: boolean;
  bulkTouchedOnly: boolean;
  links: string[];
  errors: string[];
};

export async function listPendingOwnerVoiceArticles(limit = 10) {
  const articles = await loadArticles({
    limit,
    onlyOthers: false,
    fetchAll: false,
    bulkTouchedOnly: false,
    includeDrafts: false
  });

  return articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    published_path: articlePath(article)
  }));
}

export async function runOwnerVoiceRewrite(
  input: OwnerVoiceRewriteOptions = {}
): Promise<OwnerVoiceRewriteResult> {
  const fetchAll = input.all ?? false;
  const limit = fetchAll ? undefined : (input.limit ?? 5);
  const since = input.since;
  const dryRun = input.dryRun ?? false;
  const draftOnFail = input.draftOnFail ?? false;
  const onlyOthers = input.onlyOthers ?? false;
  const bulkTouchedOnly = input.bulkTouchedOnly ?? false;
  const includeDrafts = input.includeDrafts ?? Boolean(since);
  const includeSkipped = input.includeSkipped ?? false;
  const delayMs = input.delayMs ?? 0;
  const skipSlugs = input.skipSlugs;
  const articles = await loadArticles({
    limit,
    category: input.category,
    slug: input.slug,
    since,
    onlyOthers,
    fetchAll,
    bulkTouchedOnly,
    includeDrafts,
    includeSkipped,
    skipSlugs
  });
  const result: OwnerVoiceRewriteResult = {
    checked: articles.length,
    updated: 0,
    drafted: 0,
    dryRun,
    bulkTouchedOnly,
    links: [],
    errors: []
  };

  console.log(
    `[owner-voice] loaded ${articles.length} article(s)${onlyOthers ? " (others only)" : " (excluding others)"}${bulkTouchedOnly ? " [bulk-touched only]" : ""}${since ? ` [since ${since}]` : ""}${skipSlugs?.length ? ` [skipping ${skipSlugs.length} completed]` : ""}${dryRun ? " [dry-run]" : ""}`
  );

  for (const [index, article] of articles.entries()) {
    try {
      console.log(
        `[owner-voice] ${index + 1}/${articles.length} rewriting ${article.slug}`
      );
      const rewritten = await rewriteArticle(article);
      const path = articlePath(article);
      const url = `${siteConfig.url}${path}`;

      if (!dryRun) {
        const { error } = await getSupabaseClient()
          .from("articles")
          .update({
            title: rewritten.title,
            meta_description: rewritten.meta_description,
            content: rewritten.content,
            key_takeaways: rewritten.key_takeaways,
            source_name: ARTICLE_EDITORIAL_SOURCE_NAME,
            status: "published",
            updated_at: new Date().toISOString()
          })
          .eq("id", article.id);

        if (error) {
          throw error;
        }

        await enrichArticleMedia({
          articleId: article.id,
          title: rewritten.title,
          category: article.category,
          metaDescription: rewritten.meta_description
        });

        try {
          await syncArticleInlineImages({
            articleId: article.id,
            slug: article.slug,
            title: rewritten.title,
            category: article.category,
            metaDescription: rewritten.meta_description,
            limit: 3
          });
        } catch (mediaError) {
          console.warn(
            `[owner-voice] inline images skipped for ${article.slug}`,
            mediaError
          );
        }
      }

      result.updated += 1;
      result.links.push(url);
      console.log(`[owner-voice] ${dryRun ? "would update" : "updated"} ${url}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );

      if (draftOnFail && !dryRun) {
        const { error: draftError } = await getSupabaseClient()
          .from("articles")
          .update({
            status: "draft",
            updated_at: new Date().toISOString()
          })
          .eq("id", article.id);

        if (draftError) {
          result.errors.push(`${article.slug}: failed to draft: ${draftError.message}`);
        } else {
          result.drafted += 1;
          console.warn(`[owner-voice] drafted failed raw article ${article.slug}`);
        }
      }
    }

    if (delayMs > 0 && index < articles.length - 1) {
      await sleep(delayMs);
    }
  }

  if (!dryRun && result.updated > 0) {
    try {
      await revalidateSiteCache({
        paths: ["/", ...articles.map(articlePath)],
        tags: ["articles"]
      });
    } catch (error) {
      console.warn("[owner-voice] Updated articles but cache revalidate failed", error);
    }
  }

  return result;
}
