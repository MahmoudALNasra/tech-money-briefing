import type { Metadata } from "next";

import { ImageCompressorTool } from "@/components/tools/ImageCompressorTool";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Image Compressor and PNG Converter",
  description: `Compress an image, convert photos to PNG, JPG, or WebP, resize pictures, and download the optimized file for free - from ${siteConfig.name}.`,
  keywords: [
    "free image compressor",
    "PNG converter",
    "convert image to PNG",
    "compress image online",
    "resize image",
    "image converter",
    "JPG to PNG",
    "WebP converter"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function ImageCompressorPage() {
  return (
    <ToolPageShell
      eyebrow="Free image tool"
      title="Free image compressor and PNG converter"
      description="Upload a photo, resize it, choose PNG, JPG, or WebP, and download the converted image. No account needed."
      secondaryCopy="Use it to make lighter blog images, quick social assets, or PNG files from uploaded photos."
    >
      <ImageCompressorTool />
    </ToolPageShell>
  );
}
