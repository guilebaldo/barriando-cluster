/** Lee una CSS custom property en px (p. ej. --safe-area-inset-top). */
export function readCssPxVar(varName: string): number {
  if (typeof window === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Desplazamiento vertical (Leaflet/Google panBy) para dejar el hito
 * en la franja visible entre notch/status bar y la ficha inferior.
 * El popup del sello abre hacia arriba: hay que empujar el marcador más abajo.
 */
export function getMapFocusPanOffsetPx(
  bottomSheetHeight: number,
  stampPopup: boolean
): number {
  const safeTop = readCssPxVar("--safe-area-inset-top");
  const sheetOffset = bottomSheetHeight > 0 ? Math.round(bottomSheetHeight * 0.55) : 0;
  // Título + sello ~5.5rem + chrome Leaflet/Google ≈ 170–190px; + notch.
  const popupOffset = stampPopup ? Math.round(180 + safeTop) : Math.round(safeTop + 12);
  return sheetOffset + popupOffset;
}
