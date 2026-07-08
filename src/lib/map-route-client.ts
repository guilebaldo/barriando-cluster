export type MapPointKind = "milestone" | "premium_business";

export type MapRoutePoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
  kind: MapPointKind;
  order: number;
  category?: string;
  zone?: number;
  socioId?: number;
  hasSeasonalStamp?: boolean;
};

export type MapRouteResult = {
  startName: string;
  points: MapRoutePoint[];
  walkPath: Array<[number, number]>;
  totalStops: number;
  milestoneCount: number;
  premiumCount: number;
};

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function findNearestRoutePoint(
  location: { latitude: number; longitude: number },
  points: MapRoutePoint[]
): MapRoutePoint | null {
  if (points.length === 0) return null;
  let best = points[0];
  let bestDist = Infinity;
  for (const p of points) {
    const d = haversineDistanceKm(location, p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

/** Itinerario peatonal: conserva el circuito original y solo rota el inicio al punto más cercano. */
export function buildWalkingItinerary(
  location: { latitude: number; longitude: number },
  route: MapRouteResult
): MapRouteResult {
  if (route.points.length === 0) return route;

  const start = findNearestRoutePoint(location, route.points);
  if (!start) return route;
  const idx = route.points.findIndex((p) => p.id === start.id);
  if (idx < 0) return route;

  const rotated = [...route.points.slice(idx), ...route.points.slice(0, idx)];
  const points = rotated.map((p, i) => ({
    ...p,
    category:
      i === 0
        ? "Punto más cercano"
        : p.category?.replace("Punto de partida", "Hito patrimonial") ?? p.category,
  }));

  return {
    ...route,
    startName: points[0]?.name ?? route.startName,
    points,
  };
}

export function reorderRouteFromPoint(
  route: MapRouteResult,
  startPointId: string
): MapRouteResult {
  const idx = route.points.findIndex((p) => p.id === startPointId);
  if (idx <= 0) return route;

  const rotated = [...route.points.slice(idx), ...route.points.slice(0, idx)];
  const points = rotated.map((p, i) => ({
    ...p,
    category:
      i === 0
        ? "Punto de partida"
        : p.category?.replace("Punto de partida", "Hito patrimonial") ?? p.category,
  }));

  return {
    ...route,
    startName: points[0]?.name ?? route.startName,
    points,
  };
}
