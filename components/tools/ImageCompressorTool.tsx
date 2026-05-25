"use client";

import { useMemo, useRef, useState } from "react";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

const formatLabels: Record<OutputFormat, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WebP"
};

function extensionFor(format: OutputFormat) {
  if (format === "image/jpeg") {
    return "jpg";
  }

  if (format === "image/webp") {
    return "webp";
  }

  return "png";
}

export function ImageCompressorTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("converted-image");
  const [originalSize, setOriginalSize] = useState(0);
  const [downloadSize, setDownloadSize] = useState<number | null>(null);
  const [maxWidth, setMaxWidth] = useState(1200);
  const [quality, setQuality] = useState(0.82);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [isReady, setIsReady] = useState(false);

  const savings = useMemo(() => {
    if (!downloadSize || originalSize === 0) {
      return null;
    }

    return Math.max(0, Math.round((1 - downloadSize / originalSize) * 100));
  }, [downloadSize, originalSize]);

  const renderImage = (image: HTMLImageElement, nextMaxWidth = maxWidth) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const scale = Math.min(1, nextMaxWidth / image.width);
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    setDownloadSize(null);
  };

  const handleUpload = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setFileName(file.name.replace(/\.[^.]+$/, "") || "converted-image");
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      renderImage(image);
      setIsReady(true);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const handleMaxWidthChange = (nextWidth: number) => {
    setMaxWidth(nextWidth);
    if (imageRef.current) {
      renderImage(imageRef.current, nextWidth);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) {
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        setDownloadSize(blob.size);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.${extensionFor(format)}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      format,
      quality
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <canvas
          ref={canvasRef}
          className="mx-auto block h-auto max-h-[620px] max-w-full rounded-xl bg-stone-100"
          aria-label="Image preview"
        />
        {!isReady ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-center text-sm text-stone-500">
            Upload a photo to preview the compressed or converted image.
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="image-upload"
            className="text-sm font-semibold text-stone-700"
          >
            Upload image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={(event) => handleUpload(event.target.files?.[0])}
            className="mt-2 block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-stone-200"
          />
        </div>

        <div>
          <label
            htmlFor="image-format"
            className="text-sm font-semibold text-stone-700"
          >
            Convert to
          </label>
          <select
            id="image-format"
            value={format}
            onChange={(event) => setFormat(event.target.value as OutputFormat)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900"
          >
            {Object.entries(formatLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="max-width"
            className="text-sm font-semibold text-stone-700"
          >
            Max width ({maxWidth}px)
          </label>
          <input
            id="max-width"
            type="range"
            min={320}
            max={2400}
            step={40}
            value={maxWidth}
            onChange={(event) => handleMaxWidthChange(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <div>
          <label
            htmlFor="image-quality"
            className="text-sm font-semibold text-stone-700"
          >
            Quality ({Math.round(quality * 100)}%)
          </label>
          <input
            id="image-quality"
            type="range"
            min={0.35}
            max={1}
            step={0.01}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
            className="mt-2 w-full"
          />
          <p className="mt-1 text-xs text-stone-500">
            Quality affects JPG and WebP most. PNG keeps sharper edges.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!isReady}
          className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Download converted image
        </button>

        <div className="rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
          <p>Original: {originalSize ? `${Math.round(originalSize / 1024)} KB` : "Not uploaded"}</p>
          <p>Latest download: {downloadSize ? `${Math.round(downloadSize / 1024)} KB` : "Not generated yet"}</p>
          <p>Savings: {savings === null ? "Generate to estimate" : `${savings}%`}</p>
        </div>
      </div>
    </div>
  );
}
