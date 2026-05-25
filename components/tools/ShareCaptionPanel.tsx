"use client";

import { useMemo, useState } from "react";

import { useDataLayer } from "@/hooks/useDataLayer";

type ShareCaptionPanelProps = {
  toolName: string;
  captions: string[];
};

export function ShareCaptionPanel({ toolName, captions }: ShareCaptionPanelProps) {
  const pushToDataLayer = useDataLayer();
  const [copied, setCopied] = useState<string | null>(null);

  const items = useMemo(() => captions.filter(Boolean), [captions]);

  const copyCaption = async (caption: string) => {
    await navigator.clipboard.writeText(caption);
    setCopied(caption);
    pushToDataLayer({
      event: "share_caption_copy",
      tool_name: toolName,
      caption_length: caption.length
    });
  };

  return (
    <div className="mt-10 rounded-2xl border border-stone-200 bg-stone-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
        Share captions
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Copy a suggested social post to pair with your download.
      </p>
      <div className="mt-4 grid gap-3">
        {items.map((caption) => (
          <button
            key={caption}
            type="button"
            onClick={() => copyCaption(caption)}
            className="rounded-2xl border border-stone-200 bg-white p-4 text-left text-sm leading-6 text-stone-800 transition hover:border-stone-400"
          >
            {caption}
            <span className="mt-2 block text-xs font-medium text-stone-500">
              {copied === caption ? "Copied" : "Click to copy caption"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
