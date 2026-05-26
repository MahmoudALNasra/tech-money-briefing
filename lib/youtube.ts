export type YouTubeVideo = {
  provider: "youtube";
  provider_id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
};

export class YouTubeQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeQuotaError";
  }
}

export function isYouTubeQuotaError(error: unknown) {
  return error instanceof YouTubeQuotaError;
}

type YouTubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

function cleanYouTubeTitle(title: string) {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVideoSearchQuery(input: {
  title: string;
  category?: string;
  metaDescription?: string;
}) {
  const context = [input.title, input.metaDescription, input.category]
    .filter(Boolean)
    .join(" ")
    .replace(/[^\w\s'"-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${context} explainer latest`.slice(0, 220);
}

export async function searchYouTubeVideos(input: {
  title: string;
  category?: string;
  metaDescription?: string;
  maxResults?: number;
}) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("[youtube] Skipped: YOUTUBE_API_KEY is not configured");
    return [];
  }

  const maxResults = Math.min(Math.max(input.maxResults ?? 3, 1), 3);
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(maxResults),
    q: buildVideoSearchQuery(input),
    key: apiKey,
    safeSearch: "moderate",
    videoEmbeddable: "true",
    relevanceLanguage: "en"
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    {
      headers: {
        "User-Agent":
          "TechRevenueBrief/1.0 (+https://techrevenuebrief.com; article media)"
      },
      signal: AbortSignal.timeout(10000)
    }
  );

  if (!response.ok) {
    const message = await response.text();
    const isQuotaError =
      message.includes("quotaExceeded") ||
      message.includes("rateLimitExceeded") ||
      message.includes("userRateLimitExceeded");

    if (isQuotaError) {
      throw new YouTubeQuotaError(
        `YouTube quota exhausted (${response.status}): ${message}`
      );
    }

    throw new Error(`YouTube search failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const seen = new Set<string>();

  return (data.items ?? [])
    .map((item): YouTubeVideo | null => {
      const videoId = item.id?.videoId;
      const title = item.snippet?.title;

      if (!videoId || !title || seen.has(videoId)) {
        return null;
      }

      seen.add(videoId);

      return {
        provider: "youtube",
        provider_id: videoId,
        title: cleanYouTubeTitle(title),
        thumbnail_url:
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??
          null,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    })
    .filter((video): video is YouTubeVideo => Boolean(video))
    .slice(0, maxResults);
}
