import {
  ARTICLE_EDITORIAL_SOURCE_NAME,
  ARTICLE_ORIGINALITY_INSTRUCTIONS,
  OWNER_VOICE_REWRITE_GUIDE,
  stripGeneratedSourceFooter
} from "../lib/article-attribution";
import { normalizeArticleContent } from "../lib/article-markdown";
import { getStaticInternalLinksForText } from "../lib/internal-links";
import { loadLocalEnv } from "../lib/load-env";
import { getOpenAIClient } from "../lib/openai";
import { revalidateSiteCache } from "../lib/revalidate-site";
import { siteConfig } from "../lib/site";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

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
};

type RewrittenArticle = {
  title: string;
  meta_description: string;
  content: string;
  key_takeaways: string[];
};

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length).trim() || undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function articlePath(article: Pick<ArticleRow, "category" | "slug">) {
  return `/${article.category}/${article.slug}`;
}

async function loadArticles(options: {
  limit: number;
  category?: string;
  slug?: string;
  includeOthers: boolean;
}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("articles")
    .select(
      "id,title,slug,meta_description,content,key_takeaways,category,source_name,source_url"
    )
    .eq("status", "published")
    .not("source_name", "ilike", "%Referral%")
    .order("published_at", { ascending: false })
    .limit(options.limit);

  if (!options.includeOthers) {
    query = query.neq("category", "others");
  }

  if (options.category) {
    query = query.eq("category", options.category);
  }

  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  return (data ?? []) as ArticleRow[];
}

async function rewriteArticle(article: ArticleRow): Promise<RewrittenArticle> {
  const internalLinks = getStaticInternalLinksForText(
    [article.title, article.meta_description, article.category, article.content]
      .join(" ")
      .slice(0, 5000),
    5
  );

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.42,
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
        content:
          "You rewrite Tech Revenue Brief articles in the owner's original voice. Return only valid JSON. Preserve the topic and factual meaning, but rebuild the article from scratch so it is original, useful, and not a source summary."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Rewrite this published article in the current Tech Revenue Brief owner voice.",
          rules: [
            ...ARTICLE_ORIGINALITY_INSTRUCTIONS,
            ...OWNER_VOICE_REWRITE_GUIDE,
            "Preserve the same URL intent: do not turn the article into a different topic.",
            "Do not mention that the article was rewritten, generated, based on RSS, or based on another article.",
            "Do not add a Source footer, Read more link, original source block, or citation unless the old article includes a specific statistic or official claim that absolutely needs a citation.",
            "Keep useful internal links, but do not force them. Internal links must use root-relative paths only.",
            "Use markdown only. Do not include an H1 because the title is stored separately.",
            "Use a direct opening paragraph, ## Quick Answer, practical sections, and ## FAQ with 3-4 questions.",
            "Aim for 850-1200 words. Prefer clarity and usefulness over length.",
            "Generate exactly 3 key_takeaways as short, useful strings.",
            "Generate a meta_description between 120 and 155 characters when possible."
          ],
          availableInternalLinks: internalLinks.map((link) => ({
            label: link.label,
            href: link.href
          })),
          article: {
            id: article.id,
            slug: article.slug,
            category: article.category,
            currentTitle: article.title,
            currentMetaDescription: article.meta_description,
            currentKeyTakeaways: article.key_takeaways ?? [],
            currentContent: article.content
          }
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

async function run() {
  const limit = getNumberArg("limit", 5);
  const category = getStringArg("category");
  const slug = getStringArg("slug");
  const dryRun = hasFlag("dry-run");
  const includeOthers = hasFlag("include-others");
  const articles = await loadArticles({ limit, category, slug, includeOthers });
  const result = {
    checked: articles.length,
    updated: 0,
    dryRun,
    links: [] as string[],
    errors: [] as string[]
  };

  for (const article of articles) {
    try {
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
            updated_at: new Date().toISOString()
          })
          .eq("id", article.id);

        if (error) {
          throw error;
        }
      }

      result.updated += 1;
      result.links.push(url);
      console.log(`[owner-voice] ${dryRun ? "would update" : "updated"} ${url}`);
    } catch (error) {
      result.errors.push(
        `${article.slug}: ${error instanceof Error ? error.message : String(error)}`
      );
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

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[owner-voice] Rewrite failed", error);
  process.exitCode = 1;
});
