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

const PREMIUM_DETOUR_RADIUS_KM = 0.4;

/** Itinerario peatonal: desde el hito más cercano, prioriza Gran Empresa cercanos y luego el siguiente punto más próximo. */
export function buildWalkingItinerary(
  location: { latitude: number; longitude: number },
  route: MapRouteResult
): MapRouteResult {
  if (route.points.length === 0) return route;

  const start = findNearestRoutePoint(location, route.points);
  if (!start) return route;

  const unvisited = new Map(route.points.map((p) => [p.id, p]));
  const ordered: MapRoutePoint[] = [];
  let current = start;
  let currentLoc = { latitude: current.latitude, longitude: current.longitude };

  unvisited.delete(current.id);
  ordered.push({ ...current, order: 1, category: "Punto de partida" });

  while (unvisited.size > 0) {
    const candidates = [...unvisited.values()];

    const nearbyPremium = candidates
      .filter((p) => p.kind === "premium_business")
      .map((p) => ({ p, d: haversineDistanceKm(currentLoc, p) }))
      .filter((x) => x.d <= PREMIUM_DETOUR_RADIUS_KM)
      .sort((a, b) => a.d - b.d);

    let next: MapRoutePoint;
    if (nearbyPremium.length > 0) {
      next = nearbyPremium[0].p;
    } else {
      next = candidates.reduce((best, p) => {
        const d = haversineDistanceKm(currentLoc, p);
        const bestD = haversineDistanceKm(currentLoc, best);
        return d < bestD ? p : best;
      });
    }

    unvisited.delete(next.id);
    ordered.push({
      ...next,
      order: ordered.length + 1,
      category:
        next.category === "Punto de partida"
          ? next.kind === "premium_business"
            ? next.category
            : "Hito patrimonial"
          : next.category,
    });
    currentLoc = { latitude: next.latitude, longitude: next.longitude };
  }

  const walkPath = ordered.map((p) => [p.latitude, p.longitude] as [number, number]);

  return {
    ...route,
    startName: ordered[0]?.name ?? route.startName,
    points: ordered,
    walkPath,
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
    order: i + 1,
    category:
      i === 0
        ? "Punto de partida"
        : p.category?.replace("Punto de partida", "Hito patrimonial") ?? p.category,
  }));

  const walkPath = points.map((p) => [p.latitude, p.longitude] as [number, number]);

  return {
    ...route,
    startName: points[0]?.name ?? route.startName,
    points,
    walkPath,
  };
}
