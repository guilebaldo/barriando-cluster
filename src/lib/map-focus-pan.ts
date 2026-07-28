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
 * Desplazamiento vertical (misma fórmula que el panBy anterior que ya centraba bien).
 * offset > 0 → el marcador queda más arriba en pantalla (libre de la ficha).
 */
export function getMapFocusPanOffsetPx(
  bottomSheetHeight: number,
  stampPopup: boolean
): number {
  const safeTop = readCssPxVar("--safe-area-inset-top");
  const sheetOffset = bottomSheetHeight > 0 ? Math.round(bottomSheetHeight * 0.55) : 0;
  const popupOffset = stampPopup ? Math.round(180 + safeTop) : Math.round(safeTop + 12);
  return sheetOffset + popupOffset;
}

/**
 * Un solo flyTo a la posición final correcta (equivalente a flyTo + panBy([0, offsetY])).
 * En Leaflet, y crece al sur: sumar offset al centro deja el punto más arriba en pantalla.
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
  const center = map.unproject([p.x, p.y + offsetY], zoom);
  map.flyTo(center, zoom, { duration, easeLinearity: 0.35 });
}

/**
 * Equivalente Google a panBy(0, offsetY) tras centrar en latLng:
 * el marcador queda más arriba (libre de la ficha).
 */
export function googleLatLngWithBottomBias(
  map: google.maps.Map,
  latLng: google.maps.LatLngLiteral,
  offsetY: number,
  zoom = 17
): google.maps.LatLngLiteral {
  if (offsetY <= 0) return latLng;

  const projection = map.getProjection();
  if (!projection) {
    // Fallback: medir con panBy real.
    const prev = map.getCenter();
    const prevZoom = map.getZoom();
    if (!prev) return latLng;
    map.setCenter(latLng);
    map.setZoom(zoom);
    map.panBy(0, offsetY);
    const target = map.getCenter();
    map.setCenter(prev);
    if (prevZoom != null) map.setZoom(prevZoom);
    if (!target) return latLng;
    return { lat: target.lat(), lng: target.lng() };
  }

  const scale = Math.pow(2, zoom);
  const world = projection.fromLatLngToPoint(new google.maps.LatLng(latLng.lat, latLng.lng));
  if (!world) return latLng;
  // y crece al sur; sumar mueve el centro al sur → marcador más arriba en pantalla.
  const pixelToWorld = 1 / (256 * scale);
  const shifted = new google.maps.Point(world.x, world.y + offsetY * pixelToWorld);
  const out = projection.fromPointToLatLng(shifted);
  if (!out) return latLng;
  return { lat: out.lat(), lng: out.lng() };
}
