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
 * Desplazamiento vertical para centrar el pin en la banda visible.
 * offset > 0 → el marcador queda más arriba en pantalla.
 *
 * `viewportHeight` debe ser el alto del contenedor del mapa (p. ej.
 * map.getSize().y), no window.innerHeight: el shell ya resta el hub
 * con padding y si usamos la ventana el pin queda demasiado abajo.
 *
 * Con sello/globo: reserva notch + altura del popup para que el globo
 * quede bajo el safe-area (Safari y standalone), no pegado ni tapado.
 */
export function getMapFocusPanOffsetPx(
  bottomSheetHeight: number,
  stampPopup: boolean,
  viewportHeight?: number
): number {
  const H =
    typeof viewportHeight === "number" && viewportHeight > 0
      ? Math.round(viewportHeight)
      : typeof window !== "undefined"
        ? Math.round(window.visualViewport?.height ?? window.innerHeight)
        : 700;
  const safeTop = Math.max(0, readCssPxVar("--safe-area-inset-top"));
  // Globo abre arriba del pin: reserva su alto + un poco de aire.
  const topPad = stampPopup
    ? Math.round(safeTop + 28 + 168)
    : Math.round(safeTop + 16);
  // Extra aire para que el pin no quede pegado al borde de la ficha.
  const bottomPad = bottomSheetHeight > 0 ? Math.round(bottomSheetHeight + 16) : 0;
  const usable = Math.max(140, H - topPad - bottomPad);
  // Interpola según qué tanto de la pantalla come la ficha:
  // ficha baja (cuponera / colapsada) → pin más centrado;
  // ficha alta (MAPA expandido) → pin más arriba.
  // Con globo de sello, el pin se mantiene más alto para dejar el popup.
  const sheetFrac = H > 0 ? bottomPad / H : 0;
  const t = Math.min(1, Math.max(0, (sheetFrac - 0.18) / 0.4));
  const ratio = stampPopup ? 0.22 + 0.08 * t : 0.5 - 0.22 * t;
  const targetFromTop = topPad + usable * ratio;
  return Math.round(H / 2 - targetFromTop);
}

/**
 * flyTo / setView con bias vertical.
 * duration <= 0 → setView sin animación (correcciones de ficha sin rubber-band).
 */
export function leafletFlyToWithBottomBias(
  map: LeafletMap,
  latlng: LatLngExpression,
  zoom: number,
  offsetY: number,
  duration = 0.45
): void {
  let center: LatLngExpression = latlng;
  if (offsetY !== 0) {
    const p = map.project(latlng, zoom);
    center = map.unproject([p.x, p.y + offsetY], zoom);
  }

  if (duration <= 0) {
    map.setView(center, zoom, { animate: false });
    return;
  }

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
  if (offsetY === 0) return latLng;

  const projection = map.getProjection();
  if (!projection) {
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
  const pixelToWorld = 1 / (256 * scale);
  const shifted = new google.maps.Point(world.x, world.y + offsetY * pixelToWorld);
  const out = projection.fromPointToLatLng(shifted);
  if (!out) return latLng;
  return { lat: out.lat(), lng: out.lng() };
}
