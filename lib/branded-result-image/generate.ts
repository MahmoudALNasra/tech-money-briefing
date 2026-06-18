import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { createBrandedResultImageElement } from "@/lib/branded-result-image/render-template";
import { sanitizeBrandedImageInput } from "@/lib/branded-result-image/sanitize-input";
import type {
  BrandedResultImageInput,
  BrandedResultImageVariant,
  BrandedResultImageVariants
} from "@/lib/branded-result-image/types";
import {
  BRANDED_IMAGE_LANDSCAPE_SIZE,
  BRANDED_IMAGE_SQUARE_SIZE
} from "@/lib/branded-result-image/types";

let cachedLogoSrc: string | null = null;

async function getLogoDataUri() {
  if (cachedLogoSrc) {
    return cachedLogoSrc;
  }

  const logoPath = path.join(process.cwd(), "public", "logo.svg");
  const logoSvg = await readFile(logoPath, "utf8");
  cachedLogoSrc = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;
  return cachedLogoSrc;
}

async function renderBrandedResultVariant(
  input: BrandedResultImageInput,
  variant: BrandedResultImageVariant
) {
  const safeInput = sanitizeBrandedImageInput(input);
  const logoSrc = await getLogoDataUri();
  const size =
    variant === "square" ? BRANDED_IMAGE_SQUARE_SIZE : BRANDED_IMAGE_LANDSCAPE_SIZE;

  const response = new ImageResponse(
    createBrandedResultImageElement({ input: safeInput, variant, logoSrc }),
    {
      width: size.width,
      height: size.height
    }
  );

  return Buffer.from(await response.arrayBuffer());
}

export async function generateBrandedResultImage(input: BrandedResultImageInput) {
  const [square, landscape] = await Promise.all([
    renderBrandedResultVariant(input, "square"),
    renderBrandedResultVariant(input, "landscape")
  ]);

  return {
    square,
    landscape
  };
}

export function encodeBrandedResultImageVariants(buffers: {
  square: Buffer;
  landscape: Buffer;
}): BrandedResultImageVariants {
  return {
    square: {
      contentType: "image/png",
      base64: buffers.square.toString("base64"),
      width: BRANDED_IMAGE_SQUARE_SIZE.width,
      height: BRANDED_IMAGE_SQUARE_SIZE.height
    },
    landscape: {
      contentType: "image/png",
      base64: buffers.landscape.toString("base64"),
      width: BRANDED_IMAGE_LANDSCAPE_SIZE.width,
      height: BRANDED_IMAGE_LANDSCAPE_SIZE.height
    }
  };
}

export function decodeBrandedResultImageVariant(
  variants: BrandedResultImageVariants,
  variant: BrandedResultImageVariant
) {
  const entry = variants[variant];
  return Buffer.from(entry.base64, "base64");
}
