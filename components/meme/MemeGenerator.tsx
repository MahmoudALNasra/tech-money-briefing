"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDataLayer } from "@/hooks/useDataLayer";
import {
  CANVAS_SIZE,
  drawMemeTemplate,
  MEME_TEMPLATES,
  type MemeTemplateId
} from "@/lib/meme-templates";

const DEFAULT_TOP = "WHEN THE RPM";
const DEFAULT_BOTTOM = "IS $0.02";

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const next = `${current} ${words[index]}`;
    if (ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = words[index];
    } else {
      current = next;
    }
  }

  lines.push(current);
  return lines;
}

function drawImpactText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  fontSize: number,
  fillColor: string,
  maxWidth: number
) {
  const upper = text.toUpperCase();
  ctx.font = `bold ${fontSize}px Impact, "Arial Black", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, Math.round(fontSize / 10));
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = fillColor;

  const lines = wrapLines(ctx, upper, maxWidth);
  const lineHeight = fontSize * 1.15;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

export function MemeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const customImageRef = useRef<HTMLImageElement | null>(null);
  const pushToDataLayer = useDataLayer();

  const [templateId, setTemplateId] =
    useState<MemeTemplateId>("disappointed-guy");
  const [topText, setTopText] = useState(DEFAULT_TOP);
  const [bottomText, setBottomText] = useState(DEFAULT_BOTTOM);
  const [fontSize, setFontSize] = useState(64);
  const [textColor, setTextColor] = useState("#ffffff");
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customImageReady, setCustomImageReady] = useState(false);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;
    ctx.clearRect(0, 0, width, height);

    if (customImageRef.current && customImageReady) {
      drawImageCover(ctx, customImageRef.current, width, height);
    } else {
      drawMemeTemplate(ctx, width, height, templateId);
    }

    const maxTextWidth = width - 80;
    if (topText.trim()) {
      drawImpactText(
        ctx,
        topText,
        width / 2,
        36,
        fontSize,
        textColor,
        maxTextWidth
      );
    }

    if (bottomText.trim()) {
      const bottomFont = fontSize;
      ctx.font = `bold ${bottomFont}px Impact, "Arial Black", Arial, sans-serif`;
      const lines = wrapLines(
        ctx,
        bottomText.toUpperCase(),
        maxTextWidth
      );
      const lineHeight = bottomFont * 1.15;
      const blockHeight = lines.length * lineHeight;
      const startY = height - blockHeight - 36;

      drawImpactText(
        ctx,
        bottomText,
        width / 2,
        startY,
        bottomFont,
        textColor,
        maxTextWidth
      );
    }
  }, [
    templateId,
    topText,
    bottomText,
    fontSize,
    textColor,
    customImageReady
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    return () => {
      if (customImageUrl) {
        URL.revokeObjectURL(customImageUrl);
      }
    };
  }, [customImageUrl]);

  const handleTemplateChange = (nextId: MemeTemplateId) => {
    setTemplateId(nextId);
    if (customImageUrl) {
      URL.revokeObjectURL(customImageUrl);
      setCustomImageUrl(null);
      customImageRef.current = null;
      setCustomImageReady(false);
    }
  };

  const handleImageUpload = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (customImageUrl) {
      URL.revokeObjectURL(customImageUrl);
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      customImageRef.current = image;
      setCustomImageReady(true);
    };
    image.src = url;
    setCustomImageUrl(url);
  };

  const clearUpload = () => {
    if (customImageUrl) {
      URL.revokeObjectURL(customImageUrl);
    }
    customImageRef.current = null;
    setCustomImageUrl(null);
    setCustomImageReady(false);
  };

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
      link.download = `tech-revenue-meme-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);

      pushToDataLayer({
        event: "meme_download",
        page_path: "/meme-generator",
        template_id: customImageUrl ? "upload" : templateId
      });
    }, "image/png");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-lg">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="mx-auto block h-auto w-full max-w-full"
          aria-label="Meme preview"
        />
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-sm font-semibold text-stone-700">
            Template
          </label>
          <div className="mt-2 grid max-h-[520px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {MEME_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateChange(template.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  templateId === template.id && !customImageUrl
                    ? "border-ink bg-ink text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                }`}
              >
                <span className="font-semibold">{template.name}</span>
                <span
                  className={`mt-0.5 block text-xs ${
                    templateId === template.id && !customImageUrl
                      ? "text-stone-300"
                      : "text-stone-500"
                  }`}
                >
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="meme-upload"
            className="text-sm font-semibold text-stone-700"
          >
            Or upload your own image
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="meme-upload"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-stone-200"
              onChange={(event) =>
                handleImageUpload(event.target.files?.[0])
              }
            />
            {customImageUrl ? (
              <button
                type="button"
                onClick={clearUpload}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
              >
                Use template again
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="meme-top"
            className="text-sm font-semibold text-stone-700"
          >
            Top text
          </label>
          <input
            id="meme-top"
            type="text"
            value={topText}
            onChange={(event) => setTopText(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
            placeholder="TOP TEXT"
          />
        </div>

        <div>
          <label
            htmlFor="meme-bottom"
            className="text-sm font-semibold text-stone-700"
          >
            Bottom text
          </label>
          <input
            id="meme-bottom"
            type="text"
            value={bottomText}
            onChange={(event) => setBottomText(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
            placeholder="BOTTOM TEXT"
          />
        </div>

        <div>
          <label
            htmlFor="meme-font-size"
            className="text-sm font-semibold text-stone-700"
          >
            Font size ({fontSize}px)
          </label>
          <input
            id="meme-font-size"
            type="range"
            min={32}
            max={96}
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <div>
          <label
            htmlFor="meme-text-color"
            className="text-sm font-semibold text-stone-700"
          >
            Text color
          </label>
          <input
            id="meme-text-color"
            type="color"
            value={textColor}
            onChange={(event) => setTextColor(event.target.value)}
            className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-stone-200"
          />
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          Download PNG
        </button>

        <p className="text-xs leading-5 text-stone-500">
          Original canvas templates only - no stolen meme images. Share the
          link or download and post anywhere.
        </p>
      </div>
    </div>
  );
}
