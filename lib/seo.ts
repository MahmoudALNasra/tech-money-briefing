import type { Article } from "@/lib/types";
import { ARTICLE_EDITORIAL_SOURCE_NAME } from "@/lib/article-attribution";
import { absoluteUrl, siteConfig } from "@/lib/site";

export function articleUrl(article: Pick<Article, "category" | "slug">) {
  return absoluteUrl(`/${article.category}/${article.slug}`);
}

export function articleImage(
  article: Pick<Article, "image_url">,
  resolvedImageUrl?: string | null
) {
  return resolvedImageUrl ?? article.image_url ?? absoluteUrl("/og-default-v3.png");
}

export function articleImageAlt(
  article: Pick<Article, "title" | "category">
) {
  return `${article.title} - ${article.category.replace(/-/g, " ")} guide from ${siteConfig.name}`;
}

export function newsArticleJsonLd(
  article: Article,
  resolvedImageUrl?: string | null,
  extraImages: Array<{ url: string; caption?: string | null }> = []
) {
  const publishedAt = article.published_at ?? new Date().toISOString();
  const imageUrl = articleImage(article, resolvedImageUrl);

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.meta_description,
    image: [
      {
        "@type": "ImageObject",
        url: imageUrl,
        caption: articleImageAlt(article)
      },
      ...extraImages.map((image) => ({
        "@type": "ImageObject",
        url: image.url,
        caption: image.caption ?? articleImageAlt(article)
      }))
    ],
    thumbnailUrl: imageUrl,
    datePublished: publishedAt,
    dateModified: article.updated_at ?? publishedAt,
    mainEntityOfPage: articleUrl(article),
    articleSection: article.category,
    author: {
      "@type": "Organization",
      name: ARTICLE_EDITORIAL_SOURCE_NAME,
      url: siteConfig.url
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.svg")
      }
    }
  };
}

export function faqJsonLd(article: Article) {
  const faqItems = extractFaqItems(article.content);
  return faqJsonLdFromItems(faqItems);
}

export function faqJsonLdFromItems(
  faqItems: Array<{ question: string; answer: string }>
) {
  if (faqItems.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function webApplicationJsonLd(input: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url
    }
  };
}

function extractFaqItems(content: string) {
  const normalized = content.replace(/\\([#*_`])/g, "$1");
  const faqStart = normalized.search(/^##\s+FAQ\b/im);

  if (faqStart === -1) {
    return [];
  }

  const faqContent = normalized.slice(faqStart);
  const questionMatches = [...faqContent.matchAll(/^###\s+(.+\?)\s*$/gim)];

  return questionMatches
    .map((match, index) => {
      const questionStart = (match.index ?? 0) + match[0].length;
      const nextQuestionStart = questionMatches[index + 1]?.index ?? faqContent.length;
      const answer = faqContent
        .slice(questionStart, nextQuestionStart)
        .replace(/^#{2,4}\s+.+$/gm, "")
        .replace(/\s+/g, " ")
        .trim();

      return {
        question: match[1].trim(),
        answer
      };
    })
    .filter((item) => item.question && item.answer)
    .slice(0, 4);
}
