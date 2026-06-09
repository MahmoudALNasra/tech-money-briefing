import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import { buildStaticMapUrl } from "@/lib/business-data-static-map";
import { logUsageEvent } from "@/lib/business-data-tokens";

type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
};

const mapImageCache = new Map<
  string,
  { imageBytes: ArrayBuffer; contentType: string; filename: string }
>();

function readCoordinate(value: unknown) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function makeMapImageCacheKey(input: {
  userId: string;
  center: MapPoint;
  results: MapPoint[];
}) {
  return [
    input.userId,
    input.center.lat.toFixed(5),
    input.center.lng.toFixed(5),
    ...input.results
      .slice(0, 20)
      .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
  ].join(":");
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to download subscriber map images." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const centerInput =
      typeof body.center === "object" && body.center
        ? (body.center as Record<string, unknown>)
        : null;
    const centerLat = readCoordinate(centerInput?.lat);
    const centerLng = readCoordinate(centerInput?.lng);

    if (centerLat === null || centerLng === null) {
      return NextResponse.json({ error: "A valid map center is required." }, { status: 400 });
    }

    const results: MapPoint[] = Array.isArray(body.results)
      ? body.results.reduce<MapPoint[]>((accumulator, item) => {
          if (!item || typeof item !== "object") {
            return accumulator;
          }

          const record = item as Record<string, unknown>;
          const lat = readCoordinate(record.lat);
          const lng = readCoordinate(record.lng);

          if (lat === null || lng === null) {
            return accumulator;
          }

          const label = cleanText(record.label ?? record.name, 80);
          accumulator.push({
            lat,
            lng,
            ...(label ? { label } : {})
          });

          return accumulator;
        }, [])
      : [];

    const center = {
      lat: centerLat,
      lng: centerLng,
      label: cleanText(centerInput?.label, 120)
    };
    const cacheKey = makeMapImageCacheKey({ userId: user.id, center, results });
    const cached = mapImageCache.get(cacheKey);

    if (cached) {
      return new NextResponse(cached.imageBytes, {
        headers: {
          "Content-Type": cached.contentType,
          "Content-Disposition": `attachment; filename="${cached.filename}"`,
          "Cache-Control": "private, max-age=86400",
          "X-Map-Image-Cache": "hit"
        }
      });
    }

    const imageUrl = buildStaticMapUrl({
      center,
      results
    });

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Google Static Maps is not configured." },
        { status: 503 }
      );
    }

    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "TechRevenueBriefBusinessData/1.0"
      },
      signal: AbortSignal.timeout(15000)
    });

    const contentType = imageResponse.headers.get("content-type") ?? "image/png";

    if (!imageResponse.ok || !contentType.startsWith("image/")) {
      return NextResponse.json(
        {
          error:
            "Google Static Maps did not return an image. Check that Static Maps API is enabled for this key."
        },
        { status: 502 }
      );
    }

    const payload = {
      imageBytes: await imageResponse.arrayBuffer(),
      contentType,
      filename: `business-data-map-${Date.now()}.png`
    };
    mapImageCache.set(cacheKey, payload);

    await logUsageEvent({
      userId: user.id,
      eventType: "map_image_download",
      metadata: {
        cache_key: cacheKey,
        result_count: results.length
      }
    });

    return new NextResponse(payload.imageBytes, {
      headers: {
        "Content-Type": payload.contentType,
        "Content-Disposition": `attachment; filename="${payload.filename}"`,
        "Cache-Control": "private, max-age=86400",
        "X-Map-Image-Cache": "miss"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
