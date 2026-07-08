import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { supabase } from "../lib/supabase";

type ArticleUpdate = {
  slug: string;
  title: string;
  meta_description: string;
  key_takeaways: string[];
  content: string;
};

function wordCount(content: string) {
  return content
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const updates: ArticleUpdate[] = [
  {
    slug: "google-analytics-data-delay-why-reports-lag-and-what-ga4-does-not-track",
    title: "Google Analytics 4: Why Your Reports Lag and What They Miss",
    meta_description:
      "GA4 can lag 24-48 hours for stable reporting. Use this workflow to avoid bad decisions and fill gaps with ad-platform and secondary analytics checks.",
    key_takeaways: [
      "Treat GA4 as directional during the day and set a reporting lock time before making budget decisions.",
      "GA4 does not automatically capture offline outcomes or every consent-blocked session, so use additional sources.",
      "Cross-check GA4 with Google Ads cost data plus a secondary analytics stack like Matomo or Plausible."
    ],
    content: `I had a week where GA4 showed a 28% traffic drop at 9:00 a.m. The team started blaming SEO before lunch. By the next morning most of the "drop" disappeared. Nothing magical happened. Delayed processing caught up.

## Quick Answer

Use [Google Analytics 4](https://analytics.google.com/) for direction, not same-day truth. Stable reporting can take 24-48 hours, especially when attribution and consent adjustments are involved. For operational decisions, pair GA4 with ad-platform spend data and one secondary analytics source.

## Why yesterday's report keeps changing

GA4 ingests events quickly, but not all events arrive at the same speed. Mobile sessions reconnect late, some browsers batch events, and attribution can be recalculated after additional events arrive. That is why a conversion count can move long after the click happened.

If your team checks dashboards every hour, you create fake alarms. Set a reporting lock time. We use: "yesterday is final at noon local time." That single rule removed most bad debates.

## What GA4 misses by default

GA4 does not automatically know what happened in your CRM, your phone calls, or offline payments. It also under-represents sessions when consent banners or blockers prevent tags from firing.

Filtered bots are usually good for cleaner reporting, but it means GA4 is not a full picture of every hit your infrastructure handled. If you need stronger auditability, pipe events into [BigQuery](https://cloud.google.com/bigquery) and keep server-side logs.

## A reporting setup that causes fewer mistakes

- Read GA4 for weekly movement, not minute-by-minute panic.
- Cross-check paid traffic in [Google Ads](https://ads.google.com/) before changing budgets.
- Keep one privacy-first sanity check in [Plausible](https://plausible.io/) or [Matomo](https://matomo.org/).
- Write the lock-time rule into your team SOP so everyone reads the same numbers.

Fast decisions need clear data rules, not faster dashboard refreshes.`
  },
  {
    slug: "how-to-use-ai-in-fintech-content-without-losing-trust",
    title: "How to Use AI in Fintech Content Without Losing Trust",
    meta_description:
      "Use AI in fintech copy only after source docs are locked. Keep humans on claims, disclosures, and regulatory wording before publish.",
    key_takeaways: [
      "Build a locked source pack before drafting so every claim can be traced to approved docs.",
      "Use AI for rewriting clarity and structure, not for inventing rates, eligibility, or compliance language.",
      "Run a strict publish review that checks every number, superlative, and disclosure against source material."
    ],
    content: `A fintech team I advised almost published a landing page promising "instant approval in all states." That line came from an AI draft, and nobody compared it with the real underwriting policy. Compliance caught it one hour before launch.

## Quick Answer

Use AI in fintech content only after your source documents are locked. Let AI help with clarity and structure, but never let it invent rates, eligibility, or regulatory claims. Every numeric statement and legal phrase needs a source and a human sign-off.

## Build a locked source pack first

Before generating copy, collect the exact references the writer is allowed to use:

- current fee table and APR ranges
- approved eligibility criteria
- KYC and dispute-handling language
- latest legal review notes

If the source pack is incomplete, the draft is not ready. AI is fast at producing confident sentences, including confident mistakes.

## Use AI for wording, not policy

I treat [OpenAI](https://openai.com/) and [Claude](https://www.anthropic.com/claude) as rewrite assistants, not policy engines. Good prompts ask for plain-language rewrites of text you already approved. Bad prompts ask for a full "compliance-friendly page" from scratch.

When the model creates a claim you cannot trace to a source document, delete it. Do not negotiate with the sentence.

## Run one hard review pass before publish

My review pass is simple:

- highlight every number and superlative word
- verify each highlight against the source pack
- confirm state-specific language with legal
- place disclosures near the claim, not hidden in footer text

Your team should also keep official guidance from the [CFPB](https://www.consumerfinance.gov/) and relevant state regulators bookmarked during content review.

In fintech, one sloppy sentence can cost months of trust.`
  },
  {
    slug: "how-to-calculate-newsletter-revenue-before-you-grow-the-list",
    title: "Estimating Newsletter Revenue Before Building Your Subscriber List",
    meta_description:
      "Model newsletter revenue before scaling list growth using conversion, open-rate, and sponsorship assumptions you can defend.",
    key_takeaways: [
      "Run a baseline model with realistic open-rate and paid-conversion assumptions before investing in growth.",
      "Use scenario ranges instead of one optimistic conversion target so you can see downside risk early.",
      "Scale acquisition only after multiple issues consistently hit your base-case revenue model."
    ],
    content: `Most newsletter creators ask, "How do I grow faster?" too early. The better first question is, "What does one issue need to earn so this project is worth my week?"

## Quick Answer

Model revenue before list growth using three inputs: opens, paid conversion, and sponsor CPM. If the model cannot support your target income at realistic assumptions, fix the offer before chasing subscribers. Growth multiplies a working model. It does not rescue a weak one.

## Run a five-minute baseline model

I start with 1,000 subscribers and a conservative 40% open rate.

- Opens per issue: 400
- Sponsor CPM assumption: $25 per 1,000 opens
- Sponsorship revenue per issue: about $10

Then I test paid subscriptions. If 2.5% of free readers convert at $10/month, that is 25 paid readers and $250 MRR before churn and processing fees. Include payment costs from [Stripe](https://stripe.com/) so you are not projecting gross as net.

## Pick assumptions you can defend

Creators copy outlier screenshots and assume 8-10% paid conversion. Most lists do not start there. I run three scenarios:

- conservative: 1.5% paid conversion
- base: 2.5%
- strong: 4%

If the conservative case still looks survivable, you have room to scale. If only the strong case works, your offer is fragile.

## Use platform data, not vibes

Tools like [Kit](https://kit.com/) and [beehiiv](https://www.beehiiv.com/) make open and click trends easy to track. Use those numbers to test whether readers actually want your paid angle before spending on acquisition.

My rule is simple: do not buy growth until three consecutive issues hit your base-case model.

Scale after the math works on a small list, not before.`
  },
  {
    slug: "cursor-composer-vs-chat-which-one-should-you-use",
    title: "Cursor Composer vs Chat: Choosing the Right Tool for Coding Tasks",
    meta_description:
      "Use Chat for planning and risk checks, then switch to Composer for scoped edits with explicit file boundaries and acceptance criteria.",
    key_takeaways: [
      "Start in Chat to clarify scope, risks, and test expectations before touching files.",
      "Use Composer only when file boundaries and success criteria are explicit.",
      "A clean handoff from Chat spec to Composer constraints reduces rework and messy diffs."
    ],
    content: `I have seen teams blame AI tools for bad code when the real issue was workflow. They asked Composer to "refactor auth" with no boundaries, then spent half a day undoing edits.

## Quick Answer

Use Chat to think and Composer to execute. Chat is better for approach, risk checks, and edge-case mapping before code changes. Composer is better when the task has explicit files, constraints, and a clear definition of done.

## Use Chat to de-risk the task first

In [Cursor](https://cursor.com/), Chat is where I pressure-test the work:

- which files are likely involved
- what can break if this path changes
- what tests should fail if the bug still exists

That takes five minutes and usually saves an hour of cleanup.

## Move to Composer when scope is explicit

Composer shines when your prompt includes hard boundaries such as:

- edit only these files
- keep public function names unchanged
- add tests in this folder
- stop after lint and unit tests pass

If you skip boundaries, Composer still produces output, but drift increases fast. That drift is why people think the tool is unreliable.

## A handoff pattern that keeps edits clean

My handoff looks like this:

- Chat creates a short implementation spec
- I convert that spec into Composer constraints
- Composer writes the changes
- I review the diff and run tests before commit

This pattern also helps teams switching between [Cursor](https://cursor.com/) and [GitHub Copilot](https://github.com/features/copilot), because everyone sees where planning ends and code generation starts.

## When I skip Composer

For tiny one-file tweaks or exploratory debugging, I stay in Chat and edit manually. Composer is best for deterministic, scoped edits across multiple files.

Tools are rarely the bottleneck. Prompt scope is.`
  }
];

async function main() {
  loadLocalEnv();

  const results: Array<{ slug: string; words: number }> = [];

  for (const update of updates) {
    const { error } = await supabase
      .from("articles")
      .update({
        title: update.title,
        meta_description: update.meta_description,
        key_takeaways: update.key_takeaways,
        content: update.content,
        source_name: "Tech Revenue Brief Editors",
        status: "published",
        updated_at: new Date().toISOString()
      })
      .eq("slug", update.slug);

    if (error) {
      throw new Error(`Failed ${update.slug}: ${error.message}`);
    }

    results.push({
      slug: update.slug,
      words: wordCount(update.content)
    });
  }

  await revalidateSiteCache({
    paths: ["/"],
    tags: ["articles"]
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        updated: results.length,
        results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[manual-review-rewrites] Failed", error);
  process.exitCode = 1;
});
