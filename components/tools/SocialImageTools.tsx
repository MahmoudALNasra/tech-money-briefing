"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ShareCaptionPanel } from "@/components/tools/ShareCaptionPanel";
import { useDataLayer } from "@/hooks/useDataLayer";

type SocialImageToolProps = {
  variant: "youtube" | "x-card";
};

const config = {
  youtube: {
    width: 1280,
    height: 720,
    title: "THIS CHANGES EVERYTHING",
    subtitle: "Tech revenue brief",
    buttonText: "Download thumbnail",
    fileName: "youtube-thumbnail.png"
  },
  "x-card": {
    width: 1200,
    height: 628,
    title: "AI STARTUPS JUST GOT WEIRDER",
    subtitle: "A clean social preview image for your link",
    buttonText: "Download X card",
    fileName: "x-card-preview.png"
  }
};

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = words.shift() ?? "";

  words.forEach((word) => {
    const next = `${current} ${word}`.trim();
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function SocialImageTool({ variant }: SocialImageToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pushToDataLayer = useDataLayer();
  const tool = config[variant];
  const [headline, setHeadline] = useState(tool.title);
  const [subtitle, setSubtitle] = useState(tool.subtitle);
  const [accentColor, setAccentColor] = useState("#facc15");
  const [backgroundColor, setBackgroundColor] = useState("#111827");
  const [imageReady, setImageReady] = useState(false);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = tool.width;
    canvas.height = tool.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, tool.width, tool.height);

    if (imageRef.current && imageReady) {
      drawImageCover(ctx, imageRef.current, tool.width, tool.height);
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(0, 0, tool.width, tool.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, tool.width, tool.height);
      gradient.addColorStop(0, backgroundColor);
      gradient.addColorStop(1, "#312e81");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, tool.width, tool.height);
    }

    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, variant === "youtube" ? 28 : 18, tool.height);
    ctx.fillRect(72, 72, 210, 16);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";
    ctx.lineWidth = variant === "youtube" ? 12 : 8;
    ctx.font =
      variant === "youtube"
        ? "900 86px Arial, Helvetica, sans-serif"
        : "900 70px Arial, Helvetica, sans-serif";

    const titleLines = wrapLines(ctx, headline.toUpperCase(), tool.width - 160).slice(0, 3);
    titleLines.forEach((line, index) => {
      const y = 130 + index * (variant === "youtube" ? 96 : 82);
      ctx.strokeText(line, 72, y);
      ctx.fillText(line, 72, y);
    });

    ctx.font = "700 34px Arial, Helvetica, sans-serif";
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 5;
    ctx.fillStyle = accentColor;
    const subY = tool.height - 110;
    ctx.strokeText(subtitle, 72, subY);
    ctx.fillText(subtitle, 72, subY);
  }, [accentColor, backgroundColor, headline, imageReady, subtitle, tool.height, tool.width, variant]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleUpload = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const clearImage = () => {
    imageRef.current = null;
    setImageReady(false);
  };

  const shareCaptions = useMemo(() => {
    const title = headline.trim() || tool.title;
    const sub = subtitle.trim();

    if (variant === "youtube") {
      return [
        `New thumbnail test: "${title}"\n\nDoes this stop the scroll?`,
        `${title}\n${sub}\n\nWatch the full breakdown on our channel.`,
        `We rebuilt this thumbnail around one idea: ${title}.\n\nFree tool: techrevenuebrief.com/youtube-thumbnail-maker`
      ];
    }

    return [
      `${title}\n\n${sub}`,
      `Quick take: ${title}\n\nLink in replies.`,
      `Built this X card in seconds with Tech Revenue Brief's free generator.`
    ];
  }, [headline, subtitle, tool.title, variant]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tool.fileName;
      link.click();
      URL.revokeObjectURL(url);

      pushToDataLayer({
        event: "social_image_download",
        tool_name: variant === "youtube" ? "youtube-thumbnail-maker" : "x-card-generator",
        page_path:
          variant === "youtube" ? "/youtube-thumbnail-maker" : "/x-card-generator"
      });
    }, "image/png");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <canvas
          ref={canvasRef}
          className="block h-auto w-full rounded-xl"
          aria-label={`${variant} preview`}
        />
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="social-headline" className="text-sm font-semibold text-stone-700">
            Main text
          </label>
          <textarea
            id="social-headline"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </div>

        <div>
          <label htmlFor="social-subtitle" className="text-sm font-semibold text-stone-700">
            Small text
          </label>
          <input
            id="social-subtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          />
        </div>

        <div>
          <label htmlFor="social-upload" className="text-sm font-semibold text-stone-700">
            Upload background photo
          </label>
          <input
            id="social-upload"
            type="file"
            accept="image/*"
            onChange={(event) => handleUpload(event.target.files?.[0])}
            className="mt-2 block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-stone-200"
          />
          {imageReady ? (
            <button
              type="button"
              onClick={clearImage}
              className="mt-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              Remove photo
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold text-stone-700">
            Accent
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-stone-200"
            />
          </label>
          <label className="text-sm font-semibold text-stone-700">
            Background
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-stone-200"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          {tool.buttonText}
        </button>

        <ShareCaptionPanel
          toolName={variant === "youtube" ? "youtube-thumbnail-maker" : "x-card-generator"}
          captions={shareCaptions}
        />
      </div>
    </div>
  );
}
