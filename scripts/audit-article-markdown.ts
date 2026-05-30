import { loadLocalEnv } from "../lib/load-env";
import { getSupabaseClient } from "../lib/supabase";

loadLocalEnv();

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  source_name: string;
};

type Issue = {
  code: string;
  message: string;
  sample: string;
};

type ArticleAudit = {
  slug: string;
  category: string;
  source_name: string;
  title: string;
  issues: Issue[];
  richMarkers: {
    bold: boolean;
    highlight: boolean;
    callout: boolean;
    emojiHeading: boolean;
  };
};

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv
    .filter((value) => value.startsWith(prefix))
    .at(-1);

  return arg?.slice(prefix.length).trim() || undefined;
}

function compactSample(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function lineHasEmojiHeading(line: string) {
  return /^#{2,4}\s+.*\p{Extended_Pictographic}/u.test(line);
}

function auditArticle(article: ArticleRow): ArticleAudit {
  const issues: Issue[] = [];
  const lines = article.content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (/\\#{2,4}\s+/.test(trimmed)) {
      issues.push({
        code: "escaped_heading",
        message: "Heading is escaped and may render as plain text.",
        sample: compactSample(trimmed)
      });
    }

    if (/^#{2,4}\s+.+\s+-\s+\S+/.test(trimmed)) {
      issues.push({
        code: "heading_inline_list",
        message: "Heading and bullet list are on the same line.",
        sample: compactSample(trimmed)
      });
    }

    if (/^#{2,4}\s+.+\s+\d+\.\s+\S+/.test(trimmed)) {
      issues.push({
        code: "heading_inline_ordered_list",
        message: "Heading and numbered list are on the same line.",
        sample: compactSample(trimmed)
      });
    }

    if (/^#{2,4}\s+.+\s+-\s+\[[ xX]\]/.test(trimmed)) {
      issues.push({
        code: "heading_inline_checklist",
        message: "Heading and checklist are on the same line.",
        sample: compactSample(trimmed)
      });
    }

    if (!/^[-*]\s+/.test(trimmed) && /\s+-\s+\S+.*\s+-\s+\S+/.test(trimmed)) {
      issues.push({
        code: "inline_bullets",
        message: "Multiple bullet-like items appear in one paragraph.",
        sample: compactSample(trimmed)
      });
    }

    if (/\s-\s+\[[ xX]\]\s+/.test(trimmed)) {
      issues.push({
        code: "inline_checklist",
        message: "Checklist items appear inline instead of one per line.",
        sample: compactSample(trimmed)
      });
    }
  }

  const richMarkers = {
    bold: /\*\*[^*]+\*\*/.test(article.content),
    highlight: /==[^=]+==/.test(article.content),
    callout: /^>>\s+/m.test(article.content),
    emojiHeading: lines.some(lineHasEmojiHeading)
  };

  if (!richMarkers.bold) {
    issues.push({
      code: "missing_bold",
      message: "Article has no bold markdown emphasis.",
      sample: article.title
    });
  }

  if (!richMarkers.highlight) {
    issues.push({
      code: "missing_highlight",
      message: "Article has no ==highlight== markdown marker.",
      sample: article.title
    });
  }

  if (!richMarkers.callout) {
    issues.push({
      code: "missing_callout",
      message: "Article has no >> callout line.",
      sample: article.title
    });
  }

  return {
    slug: article.slug,
    category: article.category,
    source_name: article.source_name,
    title: article.title,
    issues,
    richMarkers
  };
}

async function loadArticles(options: {
  limit: number;
  category?: string;
  slug?: string;
}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("articles")
    .select("id,slug,title,content,category,source_name")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(options.limit);

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

async function run() {
  const limit = getNumberArg("limit", 1000);
  const category = getStringArg("category");
  const slug = getStringArg("slug");
  const failOnIssues = process.argv.includes("--fail-on-issues");
  const showClean = process.argv.includes("--show-clean");

  const articles = await loadArticles({ limit, category, slug });
  const audits = articles.map(auditArticle);
  const withIssues = audits.filter((audit) => audit.issues.length > 0);
  const issueCounts = withIssues.reduce<Record<string, number>>((counts, audit) => {
    for (const issue of audit.issues) {
      counts[issue.code] = (counts[issue.code] ?? 0) + 1;
    }

    return counts;
  }, {});

  const result = {
    checked: audits.length,
    articlesWithIssues: withIssues.length,
    issueCounts,
    samples: (showClean ? audits : withIssues).slice(0, 50).map((audit) => ({
      slug: audit.slug,
      category: audit.category,
      title: audit.title,
      source_name: audit.source_name,
      richMarkers: audit.richMarkers,
      issues: audit.issues.slice(0, 8)
    }))
  };

  console.log(JSON.stringify(result, null, 2));

  if (failOnIssues && withIssues.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[article-audit] Failed", error);
  process.exitCode = 1;
});
