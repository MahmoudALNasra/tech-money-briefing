type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
};

const mapPinLabels = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getGoogleMapsKey() {
  return (
    process.env.GOOGLE_STATIC_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ??
    ""
  ).trim();
}

function getMapPinLabel(index: number) {
  return mapPinLabels[index] ?? String(index + 1);
}

export function buildStaticMapUrl(input: {
  center: MapPoint;
  results: MapPoint[];
  width?: number;
  height?: number;
}) {
  const apiKey = getGoogleMapsKey();

  if (!apiKey) {
    return "";
  }

  const width = Math.min(Math.max(input.width ?? 1200, 640), 1280);
  const height = Math.min(Math.max(input.height ?? 800, 480), 1280);
  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("maptype", "roadmap");
  url.searchParams.set("size", `${width}x${height}`);
  url.searchParams.set("scale", "2");
  url.searchParams.set("key", apiKey);

  const visiblePoints = [input.center, ...input.results].filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)
  );

  if (visiblePoints.length > 1) {
    visiblePoints.forEach((point) => {
      url.searchParams.append(
        "visible",
        `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
      );
    });
  } else {
    url.searchParams.set(
      "center",
      `${input.center.lat.toFixed(6)},${input.center.lng.toFixed(6)}`
    );
    url.searchParams.set("zoom", "14");
  }

  url.searchParams.append(
    "markers",
    `color:red|label:S|${input.center.lat.toFixed(6)},${input.center.lng.toFixed(6)}`
  );

  input.results.slice(0, 20).forEach((point, index) => {
    const markerLabel = getMapPinLabel(index);
    url.searchParams.append(
      "markers",
      `color:blue|label:${markerLabel}|${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
    );
  });

  return url.toString();
}

export function getGoogleMapsKeyForStaticMap() {
  return getGoogleMapsKey();
}
