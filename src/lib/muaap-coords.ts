/** Coordenadas del pin del lugar en URLs de Google Maps (!8m2!3d lat, !4d lng). */
export function extractPlaceCoordsFromGoogleUrl(text: string): { lat: number; lng: number } | null {
  const m8 = text.match(/!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (m8) {
    const lat = Number(m8[1]);
    const lng = Number(m8[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  const m4 = text.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (m4) {
    const lat = Number(m4[1]);
    const lng = Number(m4[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  return null;
}

/** Centro del viewport del embed (!2d lng, !3d lat) — menos preciso que el pin. */
export function extractViewportCoordsFromEmbed(html: string): { lat: number; lng: number } | null {
  const m3d = html.match(/!3d(-?\d+\.?\d*)/);
  const m2d = html.match(/!2d(-?\d+\.?\d*)/);
  if (m3d && m2d) {
    const lat = Number(m3d[1]);
    const lng = Number(m2d[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

/** Extrae lat/lng del pin si está en el HTML; si no, del viewport del embed. */
export function extractLatLngFromMapsEmbed(html: string): { lat: number; lng: number } | null {
  return extractPlaceCoordsFromGoogleUrl(html) ?? extractViewportCoordsFromEmbed(html);
}

/** Resuelve coords reales siguiendo maps.app.goo.gl → URL canónica de Google Maps. */
export async function resolveMapsPlaceCoords(mapsUrl: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(mapsUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "barriando-cluster/1.0 (MUAAP coord resolver)" },
    });
    const finalUrl = res.url;
    const body = await res.text();
    return extractPlaceCoordsFromGoogleUrl(finalUrl) ?? extractPlaceCoordsFromGoogleUrl(body);
  } catch {
    return null;
  }
}
