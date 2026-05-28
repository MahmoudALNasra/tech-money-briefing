import { REFERRAL_OFFERS } from "../lib/referral-offers";
import { loadLocalEnv } from "../lib/load-env";
import { runKeywordResearch } from "../lib/keyword-research";
import { getOpenAIClient } from "../lib/openai";
import {
  articleExistsBySourceUrl,
  createUniqueShareId,
  createUniqueSlug
} from "../lib/article-publish";
import { enrichArticleMedia } from "../lib/article-media";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ReferralArticle = {
  offerId: string;
  title: string;
  category: string;
  meta_description: string;
  key_takeaways: string[];
  content: string;
};

type KeywordPlan = Awaited<ReturnType<typeof runKeywordResearch>>;

const referralArticles: ReferralArticle[] = [
  {
    offerId: "digitalocean",
    title: "DigitalOcean Referral Link: Click Here to Sign Up for Cloud Credit",
    category: "startups",
    meta_description:
      "Click here to sign up with a DigitalOcean referral link. Learn who it fits, what to check, and how founders can use cloud credits wisely.",
    key_takeaways: [
      "DigitalOcean can be useful for founders who need hosting, databases, storage, Kubernetes, or AI infrastructure without enterprise cloud complexity.",
      "A referral link may give the new user a signup benefit while also supporting the person or site sharing the link.",
      "Use credits on a focused project first: one app, one database, one deployment workflow, and clear spending alerts."
    ],
    content: `If you are looking for a DigitalOcean referral link, you can [click here to sign up with this DigitalOcean referral link](https://m.do.co/c/623910f50e6e). This guide explains what the link is for, who DigitalOcean is useful for, and how to avoid wasting cloud credits on services you do not need yet.

Disclosure: this article contains a referral link. Tech Revenue Brief may receive referral credit if you sign up through it. You should still compare pricing, limits, and product fit before creating an account.

## Quick Answer: DigitalOcean Referral Link

The DigitalOcean referral link is useful if you want to try DigitalOcean for cloud hosting, app deployment, managed databases, storage, Kubernetes, GPU workloads, or AI infrastructure. [Click here to sign up with the DigitalOcean referral link](https://m.do.co/c/623910f50e6e) if you already planned to test DigitalOcean and want to use the referral path.

The important part is not just clicking the link. The important part is knowing what you will build before you spend credits. Cloud platforms are powerful, but they can become expensive if you create too many resources without a plan.

## What DigitalOcean Is Useful For

DigitalOcean is a cloud platform for developers, startups, and small teams that want infrastructure without the heavier feel of larger enterprise clouds. Its product set includes compute, app hosting, Kubernetes, managed databases, storage, networking, and AI infrastructure.

DigitalOcean also positions itself around AI-native cloud infrastructure. Its AI page highlights products such as GPU compute, inference, managed agents, knowledge bases, managed databases, and support for open-source AI tooling. That makes it relevant for builders experimenting with AI apps, automation tools, SaaS products, and developer platforms.

For a founder, DigitalOcean is usually most useful when you need:

- A simple VPS or app host for a web app
- A managed database for a production project
- Object storage for uploads, images, or backups
- Kubernetes once your infrastructure gets more complex
- GPU or inference infrastructure for AI workloads
- A cleaner developer experience than managing everything manually

## Click Here to Sign Up With the DigitalOcean Referral Link

Use this link if you want the direct signup path:

[Click here to sign up for DigitalOcean with the referral link](https://m.do.co/c/623910f50e6e)

Before you launch resources, make a short plan. Decide what you are testing, what budget limit you are comfortable with, and what you will delete if the test does not work. This keeps the referral credit useful instead of turning into a forgotten cloud bill.

## How to Use Cloud Credits Without Wasting Them

Start with one small project. For example, deploy a landing page, a Next.js app, a small API, or a prototype that connects to a managed database. Do not spin up multiple servers, Kubernetes clusters, or GPU workloads unless you have a clear reason.

A simple starter checklist:

1. Create one app or droplet.
2. Add one managed database only if the project needs persistence.
3. Set billing alerts immediately.
4. Write down what each resource is for.
5. Delete test resources when you are done.

If you are testing AI infrastructure, be even more careful. GPU and inference workloads can become expensive faster than simple web hosting. Start with a small workload and read pricing before scaling.

## Who Should Use This Referral Link?

The DigitalOcean referral link is a good fit for:

- Developers building side projects
- Founders testing a SaaS idea
- Agencies hosting client prototypes
- Students learning cloud deployment
- AI builders testing infrastructure
- Publishers or tool sites that need a reliable app host

It is not the right move if you do not know what you want to deploy yet. In that case, save the link, plan the project first, and sign up when you are ready to use the account.

## Common Mistakes

The biggest mistake is treating credits like free money. Credits are useful, but they can hide bad habits. If you do not understand what you created, you may forget to shut it down later.

Another mistake is starting with advanced infrastructure too early. Kubernetes, GPU machines, and complex networking can be useful, but most early projects need a simple app deployment, a small server, or a managed database first.

## FAQ

### Is this DigitalOcean link a referral link?

Yes. The DigitalOcean signup URL in this article is a referral link. Tech Revenue Brief may receive referral credit if you use it.

### Should I click here to sign up for DigitalOcean?

Click the referral link if you already want to test DigitalOcean for hosting, cloud infrastructure, databases, storage, or AI workloads. If you do not have a project yet, plan the project first.

### Can DigitalOcean help with AI apps?

DigitalOcean markets AI-native cloud products including GPU infrastructure, inference, agent tooling, and managed data products. Check the current DigitalOcean product page and pricing before choosing it for production AI workloads.

### How do I avoid surprise bills?

Set billing alerts, start with small resources, monitor usage, and delete anything you are not actively using.

Source: Tech Revenue Brief Referral Guide.`
  },
  {
    offerId: "cursor",
    title: "Cursor Referral Link: Click Here to Sign Up for Cursor AI",
    category: "ai-tools",
    meta_description:
      "Click here to sign up with a Cursor referral link. Learn what Cursor is, who should use it, and how to start coding with AI safely.",
    key_takeaways: [
      "Cursor is useful when you want AI help inside your code editor instead of copying files into a separate chatbot.",
      "A Cursor referral link is best for developers, founders, and operators who already plan to test AI-assisted coding.",
      "Start with small tasks: explain code, fix one bug, write one component, or add tests before trusting bigger refactors."
    ],
    content: `If you are looking for a Cursor referral link, you can [click here to sign up with this Cursor referral link](https://cursor.com/referral?code=CVAAK5BXQ5CO). Cursor is an AI coding editor, so the real value is not just the signup. The value is learning how to use it without letting AI make messy changes to your project.

Disclosure: this article contains a referral link. Tech Revenue Brief may receive referral credit if you sign up through it. Use the link only if Cursor fits your workflow.

## Quick Answer: Cursor Referral Link

The Cursor referral link is for people who want to try Cursor, an AI-powered code editor for building, editing, debugging, and understanding software projects. [Click here to sign up for Cursor with the referral link](https://cursor.com/referral?code=CVAAK5BXQ5CO) if you want to test AI coding inside an editor instead of using a separate chat window.

Cursor is especially useful when you already have a codebase and want the AI to understand project files, make scoped edits, explain errors, and help you move faster.

## What Cursor Is Useful For

Cursor helps with coding tasks that are painful to do manually or hard to explain in a separate chatbot. It can inspect files, suggest changes, answer project-specific questions, and help implement features.

Good uses include:

- Explaining unfamiliar code
- Fixing TypeScript or build errors
- Adding a small feature
- Writing a component
- Creating tests
- Refactoring repeated code
- Updating copy or UI sections
- Reviewing diffs before commit

Cursor is not magic. You still need to review the code, run tests, and understand what changed. But it can reduce the time between idea and working implementation.

## Click Here to Sign Up With the Cursor Referral Link

Use this direct signup path if you want to try it:

[Click here to sign up for Cursor with the referral link](https://cursor.com/referral?code=CVAAK5BXQ5CO)

After signing up, start with a low-risk project. Do not begin by asking AI to rewrite your whole app. Ask it to explain a file, fix one visible bug, or add one small UI improvement.

## How to Start Using Cursor Safely

The safest way to use Cursor is to work in small steps:

1. Open your project.
2. Ask Cursor to explain the relevant file before editing.
3. Ask for a short plan.
4. Let it edit only the files needed.
5. Review the diff.
6. Run the app or build.
7. Commit only after the change works.

This keeps the AI from making broad changes you did not ask for. It also helps you learn from the output instead of blindly accepting it.

## Who Should Use Cursor?

Cursor is a strong fit for:

- Developers who want faster implementation
- Solo founders building apps
- Designers or operators learning to ship small features
- Students learning code structure
- Technical marketers editing landing pages
- Startup teams that want AI support inside the IDE

It may not be the best fit if you never review code, never run tests, or expect AI to understand business context without instructions.

## Common Mistakes

The biggest mistake is asking Cursor to do too much at once. A request like "rebuild my app" is risky. A request like "fix this navbar spacing and explain the files you changed" is much safer.

Another mistake is accepting edits without reading them. Cursor can be fast, but speed only helps if the output is correct. Use Git, review diffs, and keep your changes small.

## FAQ

### Is this Cursor signup URL a referral link?

Yes. The Cursor URL in this article is a referral link. Tech Revenue Brief may receive referral credit if you use it.

### Should I click here to sign up for Cursor?

Click the referral link if you want to test AI-assisted coding in an editor and you are comfortable reviewing generated code.

### Is Cursor better than ChatGPT for coding?

Cursor is usually better when the task needs access to your project files. ChatGPT can still be useful for brainstorming, explaining concepts, or writing isolated snippets.

### What should I ask Cursor first?

Start with: "Explain this project structure and identify the files involved in changing X." Then ask it for a plan before editing.

Source: Tech Revenue Brief Referral Guide.`
  },
  {
    offerId: "zoho",
    title: "Zoho Referral Link: Click Here to Sign Up for Business Software",
    category: "digital-marketing",
    meta_description:
      "Click here to sign up with a Zoho referral link. Learn when Zoho fits CRM, email, accounting, support, and small business operations.",
    key_takeaways: [
      "Zoho is useful for businesses that want many operational apps under one software ecosystem.",
      "A referral link can help people discover Zoho while also supporting the referrer.",
      "Start with one clear business problem, such as CRM, email, accounting, or support, before adopting a full suite."
    ],
    content: `If you are looking for a Zoho referral link, you can [click here to sign up with this Zoho referral link](https://store.zoho.com/referral.do?ref=844526020872bb25b0a158d6bbfda59bfb09ef6a908ba66e3442c9020e82b85f94862e778e4f46eccadf30862b0de349). Zoho can be useful for small businesses because it offers many tools in one ecosystem, but you should start with the specific app your business actually needs.

Disclosure: this article contains a referral link. Tech Revenue Brief may receive referral credit if you sign up through it. Always compare features, pricing, and fit before choosing business software.

## Quick Answer: Zoho Referral Link

The Zoho referral link is useful if you want to test Zoho for CRM, business email, accounting, customer support, no-code apps, or an all-in-one business suite. [Click here to sign up for Zoho with the referral link](https://store.zoho.com/referral.do?ref=844526020872bb25b0a158d6bbfda59bfb09ef6a908ba66e3442c9020e82b85f94862e778e4f46eccadf30862b0de349) if you are evaluating Zoho and want to use the referral path.

Zoho is not one single app. It is a cloud software suite with products for sales, marketing, finance, support, email, custom apps, and operations.

## What Zoho Is Useful For

Zoho describes itself as a cloud software suite for businesses. Its product lineup includes CRM, Mail, Creator, Books, Desk, Bigin, and Zoho One. That makes it relevant for businesses that want a connected software stack instead of buying a separate tool for every department.

Common use cases include:

- Managing leads and deals in a CRM
- Creating a business email setup
- Tracking invoices, expenses, and accounting
- Running customer support tickets
- Building internal apps with low-code tools
- Managing small business operations in one suite

Zoho can be especially helpful for businesses that are growing past spreadsheets but are not ready for enterprise software complexity.

## Click Here to Sign Up With the Zoho Referral Link

Use this direct signup path if you want to evaluate Zoho:

[Click here to sign up for Zoho with the referral link](https://store.zoho.com/referral.do?ref=844526020872bb25b0a158d6bbfda59bfb09ef6a908ba66e3442c9020e82b85f94862e778e4f46eccadf30862b0de349)

Before creating a full setup, pick one business problem. For example: "We need a CRM for follow-ups," or "We need simple accounting software," or "We need support tickets instead of email chaos." That keeps the evaluation focused.

## How to Evaluate Zoho Without Getting Overwhelmed

Zoho has many apps, so the risk is trying too much at once. Start with one workflow.

A simple evaluation plan:

1. Pick one core need: CRM, Mail, Books, Desk, or Creator.
2. Add sample data from your real business.
3. Test the daily workflow for one week.
4. Invite only the team members who need that workflow.
5. Compare the cost and complexity against your current tools.
6. Expand to more Zoho apps only if the first workflow works.

This is better than signing up for a suite and trying to configure everything on day one.

## Who Should Use Zoho?

Zoho may fit:

- Small businesses that want an affordable software stack
- Agencies tracking leads and clients
- Ecommerce operators managing support and finance
- Service businesses that need CRM and invoicing
- Teams that prefer one ecosystem over many disconnected tools

It may not fit if your team already has specialized tools that work well, or if you need highly customized enterprise workflows immediately.

## Common Mistakes

The first mistake is choosing software before defining the workflow. If you do not know what process you are improving, even good software can feel confusing.

The second mistake is adopting too many apps at once. Zoho has a broad suite, but the best rollout is usually one app, one team, and one measurable workflow at a time.

## FAQ

### Is this Zoho signup URL a referral link?

Yes. The Zoho URL in this article is a referral link. Tech Revenue Brief may receive referral credit if you use it.

### Should I click here to sign up for Zoho?

Click the referral link if you are actively evaluating Zoho for CRM, email, accounting, support, no-code apps, or an all-in-one business software suite.

### What Zoho app should I try first?

Start with the app tied to your biggest operational pain. For sales, try CRM or Bigin. For finance, try Books. For support, try Desk.

### Is Zoho One worth considering?

Zoho One can make sense if you want many business apps under one ecosystem. Test individual workflows first so you know whether the suite fits your team.

Source: Tech Revenue Brief Referral Guide.`
  },
  {
    offerId: "google-ads",
    title: "Google Ads Referral Link: Click Here to Sign Up for Ad Credit",
    category: "digital-marketing",
    meta_description:
      "Click here to sign up with a Google Ads referral link. Learn how the welcome offer works and how to test paid ads safely.",
    key_takeaways: [
      "Google Ads referral offers can help new advertisers test paid search, YouTube, Display, Demand Gen, or Performance Max with a starter credit.",
      "The offer usually requires a new Google Ads account, billing setup, and a minimum spend before the ad credit is applied.",
      "Start with one campaign goal, conversion tracking, and a strict budget so the welcome offer does not become wasted ad spend."
    ],
    content: `If you are looking for a Google Ads referral link, you can [click here to sign up with this Google Ads referral welcome offer](https://business.google.com/us/google-ads/welcome-offer/?utm_source=ads-refer&utm_medium=refer-program&utm_campaign=sv-copylinkbutton). This guide explains what the offer is for, who should use it, and how to test Google Ads without burning budget.

Disclosure: this article contains a referral link. Tech Revenue Brief may receive referral credit if you sign up through it. Google Ads offers can change by country, account status, and eligibility, so review the terms before spending.

## Quick Answer: Google Ads Referral Link

The Google Ads referral link is useful if you are new to Google Ads and want to claim a welcome offer for your first campaign. [Click here to sign up for Google Ads with the referral link](https://business.google.com/us/google-ads/welcome-offer/?utm_source=ads-refer&utm_medium=refer-program&utm_campaign=sv-copylinkbutton) if you are ready to create an account, add billing, choose an offer, and meet the spend requirement.

The link is not free money by itself. Google’s welcome offer page explains that new advertisers choose an offer, complete payment setup, and receive ad credit after meeting the required spend within the offer window.

## What the Google Ads Referral Offer Is For

Google Ads helps businesses appear across Google Search, YouTube, Display, Discover, Maps, and other Google surfaces. The referral welcome offer is meant to help new advertisers start their first campaign with an incentive after they meet the offer terms.

Google’s page describes the signup flow as choosing an offer, setting up payment information, creating a first campaign, and meeting the spend requirement to unlock the ad credit. That means you should understand the budget commitment before signing up.

Good use cases include:

- Testing search ads for a product or service
- Sending traffic to a landing page
- Promoting a local business
- Testing YouTube or Demand Gen campaigns
- Validating commercial keywords before scaling SEO
- Learning what search terms convert

If you do not have a landing page, conversion goal, or budget limit, pause before using the link.

## Click Here to Sign Up With the Google Ads Referral Link

Use this direct signup path if you want the offer:

[Click here to sign up for Google Ads with the referral link](https://business.google.com/us/google-ads/welcome-offer/?utm_source=ads-refer&utm_medium=refer-program&utm_campaign=sv-copylinkbutton)

Before you start, write down three things: your campaign goal, your maximum test budget, and the conversion action you want to measure. If you skip those steps, the referral credit can disappear into clicks that do not teach you anything.

## How to Use the Google Ads Credit Safely

Start with one campaign. Do not launch Search, YouTube, Display, Performance Max, and Demand Gen all at once. Pick the campaign type that matches your goal.

A simple starter workflow:

1. Choose one offer and read the spend requirement.
2. Set up billing only when you are ready to test.
3. Build one landing page with a clear call to action.
4. Connect conversion tracking or Google Analytics.
5. Start with a conservative daily budget.
6. Review search terms, clicks, conversions, and cost per result.
7. Pause anything that spends without learning.

If your site is new, consider pairing ads with SEO tools and tracking. For campaign URLs, use a clean [UTM builder](/utm-builder). For landing page snippets, a [meta description generator](/meta-description-generator) can help you clarify the offer.

## Who Should Use This Referral Link?

The Google Ads referral link is best for:

- Small businesses testing paid acquisition
- Founders validating search demand
- Ecommerce brands promoting products
- Agencies launching a new client account
- Creators or publishers promoting a paid offer
- Local businesses testing calls, bookings, or lead forms

It is not ideal if you cannot track results. Paid ads without measurement usually become guesswork.

## Common Mistakes

The biggest mistake is claiming the offer without understanding the required spend. The second mistake is sending paid traffic to a weak page. If the page does not explain the offer clearly, ad credit will not fix the problem.

Another mistake is changing too many things at once. Keep the first test simple so you know what worked.

## FAQ

### Is this Google Ads URL a referral link?

Yes. The Google Ads URL in this article is a referral link. Tech Revenue Brief may receive referral credit if you use it.

### Should I click here to sign up for Google Ads?

Click the referral link if you are ready to create a new Google Ads account, review the welcome offer terms, add billing, and run a measured test campaign.

### Does the Google Ads credit apply immediately?

Google’s welcome offer page explains that new advertisers generally need to meet the selected spend requirement within a time period before the credit is applied. Check the exact terms shown in your account.

### What should I advertise first?

Advertise one clear offer: a product page, lead form, booking page, newsletter offer, or landing page. Avoid sending paid traffic to a vague homepage.

Source: Tech Revenue Brief Referral Guide.`
  },
  {
    offerId: "google-workspace",
    title: "Google Workspace Referral Link: Click Here to Sign Up for Business Email",
    category: "startups",
    meta_description:
      "Click here to sign up with a Google Workspace referral link. Learn when Workspace fits business email, Drive, Meet, and team tools.",
    key_takeaways: [
      "Google Workspace is useful for teams that need business email, shared files, meetings, calendars, and admin controls in one stack.",
      "A referral link is best for businesses that already plan to set up professional email or move team collaboration into Google’s tools.",
      "Start with email, Drive structure, shared calendars, and permissions before rolling Workspace out across every workflow."
    ],
    content: `If you are looking for a Google Workspace referral link, you can [click here to sign up with this Google Workspace referral link](https://referworkspace.app.goo.gl/fFHY). This guide explains who Workspace is useful for, what to set up first, and how to avoid turning a simple business email decision into messy team admin.

Disclosure: this article contains a referral link. Tech Revenue Brief may receive referral credit if you sign up through it. Review Google Workspace pricing, plan limits, and eligibility before choosing a plan.

## Quick Answer: Google Workspace Referral Link

The Google Workspace referral link is useful if you want business email, shared calendars, Google Drive, Docs, Sheets, Meet, and admin controls for your team. [Click here to sign up for Google Workspace with the referral link](https://referworkspace.app.goo.gl/fFHY) if you are ready to create a professional email setup and organize team collaboration.

Workspace is especially useful when your business has outgrown personal Gmail accounts, scattered files, or informal document sharing.

## What Google Workspace Is Useful For

Google Workspace brings Google’s business tools into a managed company environment. For many small teams, the biggest reason to sign up is professional email on a business domain. But the value usually expands into shared documents, team calendars, video meetings, Drive permissions, and admin controls.

Common use cases include:

- Business email for a custom domain
- Shared Google Drive folders
- Team calendars and meeting invites
- Google Docs, Sheets, and Slides collaboration
- Google Meet calls
- Admin controls for users and permissions
- Cleaner onboarding and offboarding

If your team already uses Google tools informally, Workspace can make the setup more professional and easier to manage.

## Click Here to Sign Up With the Google Workspace Referral Link

Use this direct signup path if you want to evaluate Workspace:

[Click here to sign up for Google Workspace with the referral link](https://referworkspace.app.goo.gl/fFHY)

Before signing up, decide which domain you will use, who needs an account, and how you want shared files organized. Those decisions matter more than rushing through the signup screen.

## How to Set Up Google Workspace Without Making a Mess

Start with the basics:

1. Choose the business domain.
2. Create accounts only for people who need them.
3. Set up email and verify DNS carefully.
4. Create shared Drive folders for core departments or projects.
5. Decide who owns billing, admin, and security.
6. Turn on basic security settings.
7. Document how files and calendars should be used.

This structure keeps Workspace useful as the team grows. Without it, files can still become scattered even inside a good tool.

For startups, Workspace fits well next to other operational tools. If you are comparing software stacks, browse the [software comparison guides](/compare) or use the [startup name generator](/startup-name-generator) when you are still shaping the business.

## Who Should Use This Referral Link?

The Google Workspace referral link is a good fit for:

- Startups setting up business email
- Agencies managing client communication
- Small teams that need shared files and calendars
- Ecommerce operators coordinating operations
- Consultants who want a professional email domain
- Founders moving away from personal Gmail workflows

It may not be necessary if you only need one personal inbox and do not need domain email, shared files, or business admin controls yet.

## Common Mistakes

The biggest mistake is setting up Workspace without a file structure. Create shared drives or folders around departments, clients, or projects early.

Another mistake is giving everyone admin access. Keep admin permissions limited. That protects billing, user accounts, and security settings.

## FAQ

### Is this Google Workspace URL a referral link?

Yes. The Google Workspace URL in this article is a referral link. Tech Revenue Brief may receive referral credit if you use it.

### Should I click here to sign up for Google Workspace?

Click the referral link if you are ready to set up business email, shared files, calendars, meetings, or team collaboration in Google’s business suite.

### Is Google Workspace only for email?

No. Email is a common starting point, but Workspace also includes collaboration tools like Drive, Docs, Sheets, Calendar, Meet, and admin controls.

### What should I prepare before signing up?

Prepare your domain, user list, billing owner, basic folder structure, and security settings. That makes the setup cleaner.

Source: Tech Revenue Brief Referral Guide.`
  }
];

async function upsertReferralArticle(article: ReferralArticle) {
  const supabase = getSupabaseClient();
  const offer = REFERRAL_OFFERS.find((entry) => entry.id === article.offerId);

  if (!offer) {
    throw new Error(`Missing referral offer for ${article.offerId}`);
  }

  const keywordPlan = await runKeywordResearch({
    seed: `${offer.name} referral link`,
    category: article.category,
    hints: {
      brand: offer.name,
      isReferral: true,
      referralUrl: offer.referralUrl
    }
  });

  const rewritten = await rewriteReferralArticleWithKeywords({
    article,
    offer,
    keywordPlan
  });

  const exists = await articleExistsBySourceUrl(offer.referralUrl);

  if (exists) {
    const { data, error } = await supabase
      .from("articles")
      .update({
        title: rewritten.title,
        content: rewritten.content,
        meta_description: rewritten.meta_description,
        key_takeaways: rewritten.key_takeaways,
        category: article.category,
        source_name: `${offer.name} Referral`,
        status: "published"
      })
      .eq("source_url", offer.referralUrl)
      .select("id,slug")
      .single();

    if (error) {
      throw new Error(`Failed to update ${article.offerId}: ${error.message}`);
    }

    return { action: "updated", id: String(data.id), slug: String(data.slug) };
  }

  const slug = await createUniqueSlug(article.title);
  const shareId = await createUniqueShareId();
  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: rewritten.title,
      slug,
      content: rewritten.content,
      meta_description: rewritten.meta_description,
      key_takeaways: rewritten.key_takeaways,
      category: article.category,
      source_name: `${offer.name} Referral`,
      source_url: offer.referralUrl,
      image_url: null,
      share_id: shareId,
      status: "published",
      published_at: new Date().toISOString()
    })
    .select("id,slug")
    .single();

  if (error) {
    throw new Error(`Failed to insert ${article.offerId}: ${error.message}`);
  }

  return { action: "inserted", id: String(data.id), slug: String(data.slug) };
}

async function rewriteReferralArticleWithKeywords(input: {
  article: ReferralArticle;
  offer: (typeof REFERRAL_OFFERS)[number];
  keywordPlan: KeywordPlan;
}) {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.35,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "referral_article",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            meta_description: { type: "string" },
            key_takeaways: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            }
          },
          required: ["title", "content", "meta_description", "key_takeaways"]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You write high-intent referral guides that are useful and transparent. Return only valid JSON. Do not stuff keywords or make income claims."
      },
      {
        role: "user",
        content: JSON.stringify({
          offer: {
            name: input.offer.name,
            referralUrl: input.offer.referralUrl
          },
          keywordPlan: input.keywordPlan,
          instructions: [
            "Write a practical referral guide that helps a real reader decide whether to sign up.",
            "Open with a 40-60 word direct answer, then include a ## Quick Answer section.",
            "Include 2-4 natural references to the primary keyword and several variants across headings and FAQ without looking spammy.",
            "Use the misspelling variants only in FAQ or a short sentence that acknowledges common typos.",
            "Include the referral link at least 4 times, but spread them across the article naturally (do not create a spam wall of links).",
            "Use markdown with ## and ### headings only.",
            "Include: who it is for, how the offer works at a high level, common mistakes, and ## FAQ with 4-6 questions.",
            "Add a clear disclosure near the top: the link is a referral link.",
            "meta_description must be between 120 and 155 characters and must include the primary keyword.",
            "Generate exactly 3 actionable key_takeaways.",
            "End content with: Source: Tech Revenue Brief Referral Guide."
          ],
          currentDraft: {
            title: input.article.title,
            meta_description: input.article.meta_description,
            key_takeaways: input.article.key_takeaways,
            content: input.article.content
          }
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty referral rewrite response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  return {
    title: String(parsed.title ?? "").trim() || input.article.title,
    content: String(parsed.content ?? "").trim() || input.article.content,
    meta_description:
      String(parsed.meta_description ?? "").trim() || input.article.meta_description,
    key_takeaways: Array.isArray(parsed.key_takeaways)
      ? parsed.key_takeaways.map((v) => String(v).trim()).filter(Boolean).slice(0, 3)
      : input.article.key_takeaways
  };
}

async function run() {
  const result = {
    checked: referralArticles.length,
    published: [] as Array<{
      offerId: string;
      action: string;
      path: string;
    }>,
    errors: [] as string[]
  };

  for (const article of referralArticles) {
    try {
      const offer = REFERRAL_OFFERS.find((entry) => entry.id === article.offerId);

      if (!offer) {
        throw new Error(`Missing offer ${article.offerId}`);
      }

      const published = await upsertReferralArticle(article);
      await enrichArticleMedia({
        articleId: published.id,
        title: article.title,
        category: article.category,
        metaDescription: article.meta_description
      });

      result.published.push({
        offerId: article.offerId,
        action: published.action,
        path: offer.articlePath
      });
      console.log(`[referrals] ${published.action} ${offer.articlePath}`);
    } catch (error) {
      result.errors.push(
        `${article.offerId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[referrals] Publish failed", error);
  process.exitCode = 1;
});
