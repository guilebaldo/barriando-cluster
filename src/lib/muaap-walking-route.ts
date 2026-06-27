/** Punto en formato Leaflet: [latitud, longitud]. */
export type WalkLatLng = [number, number];

const OSRM_BASE = "https://router.project-osrm.org/route/v1/foot";

type GeoJsonLine = {
  routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
};

function decodeGeoJsonToLeaflet(coords: [number, number][]): WalkLatLng[] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

async function fetchOsrmRoute(coordString: string): Promise<WalkLatLng[] | null> {
  const url = `${OSRM_BASE}/${coordString}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return null;
  const data = (await res.json()) as GeoJsonLine;
  const line = data.routes?.[0]?.geometry?.coordinates;
  if (!line?.length) return null;
  return decodeGeoJsonToLeaflet(line);
}

/** Ruta peatonal entre dos puntos con OSRM. */
async function fetchWalkingSegment(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<WalkLatLng[]> {
  const coordString = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const path = await fetchOsrmRoute(coordString);
  if (path?.length) return path;
  return [
    [from.latitude, from.longitude],
    [to.latitude, to.longitude],
  ];
}

/** Une segmentos evitando duplicar el primer punto de cada tramo. */
function mergeSegments(segments: WalkLatLng[][]): WalkLatLng[] {
  const merged: WalkLatLng[] = [];
  for (const segment of segments) {
    if (segment.length === 0) continue;
    if (merged.length === 0) {
      merged.push(...segment);
      continue;
    }
    const startIdx =
      merged[merged.length - 1][0] === segment[0][0] &&
      merged[merged.length - 1][1] === segment[0][1]
        ? 1
        : 0;
    merged.push(...segment.slice(startIdx));
  }
  return merged;
}

/**
 * Calcula una polilínea que sigue calles transitables (modo peatonal OSRM).
 * Intenta una sola petición con todos los waypoints; si falla, segmenta por pares.
 */
export async function buildWalkingPath(
  points: Array<{ latitude: number; longitude: number }>
): Promise<WalkLatLng[]> {
  if (points.length === 0) return [];
  if (points.length === 1) return [[points[0].latitude, points[0].longitude]];

  const coordString = points.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const full = await fetchOsrmRoute(coordString);
  if (full?.length) return full;

  const segments: WalkLatLng[][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push(await fetchWalkingSegment(points[i], points[i + 1]));
  }
  return mergeSegments(segments);
}
