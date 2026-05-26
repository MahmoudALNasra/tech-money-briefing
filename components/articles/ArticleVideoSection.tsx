"use client";

import { useState } from "react";

import type { ArticleMedia } from "@/lib/types";

type ArticleVideoSectionProps = {
  media: ArticleMedia[];
};

function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

export function ArticleVideoSection({ media }: ArticleVideoSectionProps) {
  const videos = media.filter((item) => item.provider === "youtube").slice(0, 3);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  if (videos.length === 0) {
    return null;
  }

  return (
    <aside className="mt-10 overflow-hidden rounded-3xl border border-sky-200 bg-sky-50 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
        Related Video
      </p>
      <h2 className="mt-3 text-xl font-black tracking-tight text-ink">
        Watch more context on this topic
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        These videos are loaded only when selected, so the article stays fast on
        mobile and slow connections.
      </p>

      <div className="mt-5 grid gap-4">
        {videos.map((video, index) => {
          const isActive = activeVideoId === video.provider_id;

          return (
            <div
              key={video.id}
              className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm"
            >
              {isActive ? (
                <div className="aspect-video">
                  <iframe
                    src={youtubeEmbedUrl(video.provider_id)}
                    title={video.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveVideoId(video.provider_id)}
                  className="group grid w-full gap-0 text-left sm:grid-cols-[180px_1fr]"
                >
                  <div className="relative aspect-video overflow-hidden bg-stone-200 sm:aspect-[16/10]">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-sky-100 via-stone-100 to-stone-200" />
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-stone-950/20">
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-ink shadow-lg">
                        Play
                      </span>
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                      Video {index + 1} of {videos.length}
                    </p>
                    <h3 className="mt-2 text-base font-black leading-snug text-ink">
                      {video.title}
                    </h3>
                    <p className="mt-3 text-sm font-semibold text-stone-600">
                      Tap to load YouTube embed
                    </p>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
