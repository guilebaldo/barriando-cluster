/** Heading helpers for the MAPA user marker (degrees clockwise from true north). */

export function normalizeHeading(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

/** Shortest signed delta from `from` to `to` in (-180, 180]. */
export function shortestAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

/** Exponential smooth across the 0° wrap. `alpha` closer to 1 = snappier. */
export function smoothHeading(previous: number | null, next: number, alpha = 0.18): number {
  const target = normalizeHeading(next);
  if (previous == null || !Number.isFinite(previous)) return target;
  return normalizeHeading(previous + shortestAngleDelta(previous, target) * alpha);
}

export function headingsNearlyEqual(a: number, b: number, toleranceDeg = 6): boolean {
  return Math.abs(shortestAngleDelta(a, b)) < toleranceDeg;
}

/** Round for marker redraws so Leaflet icons are not recreated every frame. */
export function quantizeHeading(deg: number | null | undefined, step = 5): number | null {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return null;
  return Math.round(normalizeHeading(deg) / step) * step % 360;
}

export function isIOSLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
