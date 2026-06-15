"use client";

import Image from "next/image";
import { useState } from "react";

import type { ArticleMedia } from "@/lib/types";
import {
  fallbackYouTubeThumbnail,
  highQualityYouTubeThumbnail
} from "@/lib/youtube-thumbnails";

type ArticleInlineMediaProps = {
  media: ArticleMedia;
  label: string;
};

function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

export function ArticleInlineMedia({ media, label }: ArticleInlineMediaProps) {
  const [isActive, setIsActive] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState(
    highQualityYouTubeThumbnail(media.provider_id)
  );

  if (media.provider !== "youtube") {
    return null;
  }

  return (
    <aside className="not-prose my-8 overflow-hidden rounded-3xl border border-sky-200 bg-sky-50 shadow-sm">
      <div className="border-b border-sky-100 bg-white px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
          {label}
        </p>
        <h3 className="mt-2 text-lg font-black leading-snug text-ink">
          {media.title}
        </h3>
      </div>

      {isActive ? (
        <div className="aspect-video">
          <iframe
            src={youtubeEmbedUrl(media.provider_id)}
            title={media.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsActive(true)}
          className="group block w-full text-left"
        >
          <div className="relative aspect-video overflow-hidden bg-stone-200">
            {thumbnailSrc ? (
              <Image
                src={thumbnailSrc}
                alt={`${media.title} related video thumbnail`}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                loading="lazy"
                onError={() =>
                  setThumbnailSrc(fallbackYouTubeThumbnail(media.provider_id))
                }
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-sky-100 via-stone-100 to-stone-200" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-stone-950/25">
              <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-ink shadow-lg">
                Play related video
              </span>
            </span>
          </div>
        </button>
      )}
    </aside>
  );
}
