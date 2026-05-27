import { REFERRAL_OFFERS } from "../lib/referral-offers";
import { loadLocalEnv } from "../lib/load-env";
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
  }
];

async function upsertReferralArticle(article: ReferralArticle) {
  const supabase = getSupabaseClient();
  const offer = REFERRAL_OFFERS.find((entry) => entry.id === article.offerId);

  if (!offer) {
    throw new Error(`Missing referral offer for ${article.offerId}`);
  }

  const exists = await articleExistsBySourceUrl(offer.referralUrl);

  if (exists) {
    const { data, error } = await supabase
      .from("articles")
      .update({
        title: article.title,
        content: article.content,
        meta_description: article.meta_description,
        key_takeaways: article.key_takeaways,
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
      title: article.title,
      slug,
      content: article.content,
      meta_description: article.meta_description,
      key_takeaways: article.key_takeaways,
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
