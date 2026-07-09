/**
 * Publish a curated owner-voice trend brief in a core category (not /others).
 * Usage: npm run articles:publish-owner-voice-trend -- --slug=anthropic-opus-4-8-what-operators-should-verify
 */

import { ARTICLE_EDITORIAL_SOURCE_NAME } from "../lib/article-attribution";
import { normalizeArticleContent } from "../lib/article-markdown";
import { enrichArticleMedia } from "../lib/article-media";
import { syncLocalizedArticleHeroImage } from "../lib/article-hero-localization";
import { syncArticleInlineImages } from "../lib/article-inline-images";
import { polishOwnerVoiceLinks } from "../lib/owner-voice/aeo-content";
import { loadLocalEnv } from "../lib/load-env";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { generateShareId } from "../lib/share-id";
import { supabase } from "../lib/supabase";

loadLocalEnv();

type TrendPublishInput = {
  slug: string;
  category: string;
  title: string;
  meta_description: string;
  key_takeaways: string[];
  content: string;
  source_url: string;
};

const TREND_ARTICLE: TrendPublishInput = {
  slug: "anthropic-opus-4-8-what-operators-should-verify-before-switching",
  category: "ai-tools",
  title: "Anthropic Opus 4.8: What Operators Should Verify Before Switching",
  meta_description:
    "Opus 4.8 buzz is loud, but most teams should verify latency, pricing, and workflow fit before moving production prompts. Use this checklist first.",
  key_takeaways: [
    "Do not migrate production prompts on launch-day hype; run the same eval set on your real docs first.",
    "Compare Opus 4.8 against your current model on cost per successful task, not cost per token alone.",
    "Keep one fallback model and document which workflows require human review regardless of model version."
  ],
  source_url: "editorial://owner-voice-trend/anthropic-opus-4-8-2026-07",
  content: `I would not swap our default assistant to Opus 4.8 because Anthropic shipped a new badge. Model launches create urgency theater. Most teams need the same boring checks they skipped last time.

## Quick Answer

Treat Opus 4.8 as a candidate model, not an automatic upgrade. Run your real contracts, support macros, and internal SOPs through the same eval set you used for your current stack. If quality improves but latency or cost per completed task gets worse, you are not winning.

## What is actually new

Launch chatter usually mixes three things: benchmark claims, safety framing, and pricing changes. Those matter, but your workflow only cares about one question: does this model finish your highest-value tasks with less editing?

I start with five tasks we already do every week: long doc summary, policy rewrite, spreadsheet explanation, support reply draft, and code refactor notes. Same prompts. Same graders. No hero prompts.

## What I would verify before switching

- Run side-by-side outputs on real internal docs, not demo paragraphs.
- Track edit time per task, not just subjective "sounds better."
- Check [Claude](https://claude.ai/) rate limits and latency on your busiest hours.
- Read [Anthropic](https://www.anthropic.com/) release notes for context-window or tool-use changes that affect your agents.
- Keep [ChatGPT](https://chatgpt.com/) or your current backup live until two weeks of stable production use.

## The mistake teams make on launch week

They change prompts, model, and workflow at once. Then nobody knows what broke. Change one variable per sprint: model first, prompt second, routing third.

If Opus 4.8 wins your eval set, promote it for one workflow only. Support macros, for example. Not the whole company in one afternoon.`
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const polished = polishOwnerVoiceLinks(TREND_ARTICLE.content, {
    category: TREND_ARTICLE.category
  });
  const content = normalizeArticleContent(polished);

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", TREND_ARTICLE.slug)
    .maybeSingle();

  const publishedAt = new Date().toISOString();
  const payload = {
    title: TREND_ARTICLE.title,
    slug: TREND_ARTICLE.slug,
    content,
    meta_description: TREND_ARTICLE.meta_description,
    key_takeaways: TREND_ARTICLE.key_takeaways,
    category: TREND_ARTICLE.category,
    source_name: ARTICLE_EDITORIAL_SOURCE_NAME,
    source_url: TREND_ARTICLE.source_url,
    status: "published",
    published_at: publishedAt,
    updated_at: publishedAt
  };

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          slug: TREND_ARTICLE.slug,
          category: TREND_ARTICLE.category,
          wordCount: content.split(/\s+/).filter(Boolean).length
        },
        null,
        2
      )
    );
    return;
  }

  let articleId = existing?.id as string | undefined;

  if (articleId) {
    const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  } else {
    const { data, error } = await supabase
      .from("articles")
      .insert({
        ...payload,
        share_id: generateShareId(),
        image_url: null
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    articleId = data?.id as string;
  }

  if (articleId) {
    await enrichArticleMedia({
      articleId,
      title: TREND_ARTICLE.title,
      category: TREND_ARTICLE.category,
      metaDescription: TREND_ARTICLE.meta_description
    });

    await syncLocalizedArticleHeroImage({
      articleId,
      currentImageUrl: null,
      preferMedia: true,
      slug: TREND_ARTICLE.slug,
      title: TREND_ARTICLE.title,
      publishedAt
    });

    try {
      await syncArticleInlineImages({
        articleId,
        slug: TREND_ARTICLE.slug,
        title: TREND_ARTICLE.title,
        category: TREND_ARTICLE.category,
        metaDescription: TREND_ARTICLE.meta_description,
        publishedAt
      });
    } catch (error) {
      console.warn("[publish-owner-voice-trend] inline images skipped", error);
    }
  }

  await revalidateSiteCache({
    paths: ["/", `/${TREND_ARTICLE.category}`, `/${TREND_ARTICLE.category}/${TREND_ARTICLE.slug}`],
    tags: ["articles"]
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: TREND_ARTICLE.slug,
        category: TREND_ARTICLE.category,
        url: `/${TREND_ARTICLE.category}/${TREND_ARTICLE.slug}`
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[publish-owner-voice-trend] Failed", error);
  process.exitCode = 1;
});
