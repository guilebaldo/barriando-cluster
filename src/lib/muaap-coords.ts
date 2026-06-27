/** Extrae lat/lng de embeds o URLs de Google Maps (formato !3d / !2d). */
export function extractLatLngFromMapsEmbed(html: string): { lat: number; lng: number } | null {
  const m3d = html.match(/!3d(-?\d+\.?\d*)/);
  const m2d = html.match(/!2d(-?\d+\.?\d*)/);
  if (m3d && m2d) {
    const lat = Number(m3d[1]);
    const lng = Number(m2d[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  const altLat = html.match(/[?&]3d(-?\d+\.?\d*)/);
  const altLng = html.match(/[?&]2d(-?\d+\.?\d*)/);
  if (altLat && altLng) {
    const lat = Number(altLat[1]);
    const lng = Number(altLng[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  return null;
}
