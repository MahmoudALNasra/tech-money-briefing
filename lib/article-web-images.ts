import { isImageUrlUsable } from "@/lib/article-images";
import { buildArticleImageAlts } from "@/lib/article-image-alt";
import { localizeRemoteArticleImageUrls } from "@/lib/article-local-images";
import {
  replaceArticleImageMedia,
  type ArticleImageCandidate
} from "@/lib/article-media";
import { logUsageEvent } from "@/lib/business-data-tokens";
import { slugify } from "@/lib/slug";

type SerperImageResult = {
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  source?: string;
  domain?: string;
  link?: string;
};

type SerperImagesResponse = {
  images?: SerperImageResult[];
};

function isBadImageUrl(url: string) {
  return (
    !/^https?:\/\//i.test(url) ||
    /encrypted-tbn|gstatic\.com\/images|googleusercontent\.com\/proxy/i.test(url)
  );
}

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function imageProviderId(imageUrl: string) {
  return slugify(imageUrl).slice(0, 80);
}

async function fetchSerperImages(query: string, limit: number) {
  const apiKey = process.env.SERPER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing SERPER_API_KEY for article image search.");
  }

  const response = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: query,
      gl: "us",
      hl: "en",
      num: Math.max(limit * 4, 10)
    }),
    signal: AbortSignal.timeout(30000)
  });
  const json = (await response.json()) as SerperImagesResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(json.message ?? `Serper image search failed (${response.status}).`);
  }

  await logUsageEvent({
    eventType: "serper_images",
    tokensCharged: 1,
    metadata: {
      endpoint: "images",
      query
    }
  });

  return json.images ?? [];
}

export async function enrichArticleWebImages(input: {
  articleId: string;
  slug: string;
  title: string;
  category: string;
  metaDescription?: string;
  publishedAt?: string | null;
  limit?: number;
}) {
  if (process.env.SKIP_SERPER_IMAGES === "true") {
    return { inserted: 0, skipped: 0 };
  }

  const limit = input.limit ?? 3;
  const query = `${input.title} ${input.category.replace(/-/g, " ")} image`;
  let results: SerperImageResult[];

  try {
    results = await fetchSerperImages(query, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Soft-fail when credits are gone so daily trends publishing still works.
    if (/quota|credit|limit|402|429|unauthorized|forbidden/i.test(message)) {
      console.warn("[article-web-images] Serper skipped:", message);
      return { inserted: 0, skipped: 0 };
    }

    throw error;
  }
  const candidates: ArticleImageCandidate[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const imageUrl = result.imageUrl?.trim();
    if (!imageUrl || seen.has(imageUrl) || isBadImageUrl(imageUrl)) {
      continue;
    }

    seen.add(imageUrl);

    if (!(await isImageUrlUsable(imageUrl))) {
      continue;
    }

    const sourceName = cleanText(result.source ?? result.domain, "Source page");
    const title = cleanText(result.title, input.title);

    candidates.push({
      providerId: imageProviderId(imageUrl),
      title,
      imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      altText: "",
      caption: null,
      sourceName,
      sourceUrl: result.link ?? null
    });

    if (candidates.length >= limit) {
      break;
    }
  }

  const alts = await buildArticleImageAlts({
    articleTitle: input.title,
    category: input.category,
    metaDescription: input.metaDescription,
    images: candidates.map((candidate) => ({
      referenceTitle: candidate.title,
      sourceName: candidate.sourceName
    }))
  });

  for (const [index, candidate] of candidates.entries()) {
    candidate.altText = alts[index] ?? candidate.title;
  }

  const localizedCandidates: ArticleImageCandidate[] = [];

  for (const [index, candidate] of candidates.entries()) {
    const localized = await localizeRemoteArticleImageUrls({
      imageUrl: candidate.imageUrl,
      thumbnailUrl: candidate.thumbnailUrl,
      slug: `${input.slug}-inline-${index + 1}`,
      title: candidate.title || input.title,
      publishedAt: input.publishedAt
    });

    if (localized) {
      localizedCandidates.push({
        ...candidate,
        imageUrl: localized.imageUrl,
        thumbnailUrl: localized.thumbnailUrl
      });
    }
  }

  return replaceArticleImageMedia(input.articleId, localizedCandidates);
}
