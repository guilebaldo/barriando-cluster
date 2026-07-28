import type { LatLngExpression, Map as LeafletMap } from "leaflet";

/** Lee una CSS custom property en px (p. ej. --safe-area-inset-top). */
export function readCssPxVar(varName: string): number {
  if (typeof window === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Desplazamiento vertical para dejar el hito en la franja visible
 * entre notch y la ficha inferior (popup del sello abre hacia arriba).
 */
export function getMapFocusPanOffsetPx(
  bottomSheetHeight: number,
  stampPopup: boolean
): number {
  const safeTop = readCssPxVar("--safe-area-inset-top");
  const sheetOffset = bottomSheetHeight > 0 ? Math.round(bottomSheetHeight * 0.5) : 0;
  // Más contenido arriba del marcador → centro un poco más al norte (marcador más abajo).
  const popupOffset = stampPopup ? Math.round(120 + safeTop * 0.6) : Math.round(safeTop * 0.5 + 8);
  return sheetOffset + popupOffset;
}

/**
 * Un solo flyTo: el centro ya incorpora el bias vertical (sin panBy después).
 * offsetY > 0 → el punto queda más abajo en pantalla.
 */
export function leafletFlyToWithBottomBias(
  map: LeafletMap,
  latlng: LatLngExpression,
  zoom: number,
  offsetY: number,
  duration = 0.7
): void {
  if (offsetY <= 0) {
    map.flyTo(latlng, zoom, { duration, easeLinearity: 0.35 });
    return;
  }
  const p = map.project(latlng, zoom);
  const center = map.unproject([p.x, p.y - offsetY], zoom);
  map.flyTo(center, zoom, { duration, easeLinearity: 0.35 });
}

/** Centro geográfico equivalente a panBy(0, offsetY) tras centrar en latLng (Google Maps). */
export function googleLatLngWithBottomBias(
  map: google.maps.Map,
  latLng: google.maps.LatLngLiteral,
  offsetY: number
): google.maps.LatLngLiteral {
  if (offsetY <= 0) return latLng;
  const projection = map.getProjection();
  if (!projection) return latLng;
  const zoom = map.getZoom() ?? 17;
  const scale = Math.pow(2, zoom);
  const world = projection.fromLatLngToPoint(new google.maps.LatLng(latLng.lat, latLng.lng));
  if (!world) return latLng;
  // y crece hacia el sur; restar mueve el centro al norte → marcador más abajo.
  const pixelToWorld = 1 / (256 * scale);
  const shifted = new google.maps.Point(world.x, world.y - offsetY * pixelToWorld);
  const out = projection.fromPointToLatLng(shifted);
  if (!out) return latLng;
  return { lat: out.lat(), lng: out.lng() };
}
