import type { Article } from "@/lib/types";
import { absoluteUrl, siteConfig } from "@/lib/site";

export function articleUrl(article: Pick<Article, "category" | "slug">) {
  return absoluteUrl(`/${article.category}/${article.slug}`);
}

export function articleImage(article: Pick<Article, "image_url">) {
  return article.image_url ?? absoluteUrl("/opengraph-default.jpg");
}

export function newsArticleJsonLd(article: Article) {
  const publishedAt = article.published_at ?? new Date().toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.meta_description,
    image: [articleImage(article)],
    datePublished: publishedAt,
    dateModified: article.updated_at ?? publishedAt,
    mainEntityOfPage: articleUrl(article),
    articleSection: article.category,
    isBasedOn: article.source_url,
    citation: article.source_url,
    author: {
      "@type": "Organization",
      name: article.source_name,
      url: article.source_url
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png")
      }
    }
  };
}
