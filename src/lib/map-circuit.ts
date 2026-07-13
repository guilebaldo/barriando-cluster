import { haversineDistanceKm } from "@/lib/map-route-client";

export type CircuitLatLng = { latitude: number; longitude: number };

/** Vértices fijos del circuito peatonal del Centro Histórico (incluye cierre al punto 1). */
export const MAP_CIRCUIT_VIA_POINTS: ReadonlyArray<CircuitLatLng & { label: string }> = [
  { label: "6 Oriente esq. 5 de Mayo", latitude: 19.046738, longitude: -98.197306 },
  {
    label: "16 de Septiembre esq. 5 Oriente/Poniente",
    latitude: 19.042942,
    longitude: -98.199533,
  },
  { label: "Av. 5 Oriente esq. 14 Sur", latitude: 19.038683, longitude: -98.191225 },
  { label: "14 Norte esq. 14 Oriente", latitude: 19.045107, longitude: -98.187982 },
  { label: "14 Oriente esq. Blvd. 5 de Mayo", latitude: 19.045633, longitude: -98.190465 },
  { label: "Blvd. 5 de Mayo esq. 8 Oriente", latitude: 19.044926, longitude: -98.191748 },
  { label: "8 Oriente esq. 6 Norte", latitude: 19.045151, longitude: -98.192241 },
  { label: "6 Norte esq. 6 Oriente", latitude: 19.044394, longitude: -98.192734 },
  { label: "cierre → 6 Oriente esq. 5 de Mayo", latitude: 19.046738, longitude: -98.197306 },
];

/** Inicio / cierre geométrico del circuito (Via 1). */
export const MAP_CIRCUIT_START = MAP_CIRCUIT_VIA_POINTS[0];

/** Hitos más lejanos que esto se excluyen del recorrido (integridad de datos). */
export const CIRCUIT_INCLUDE_MAX_LATERAL_M = 300;

/**
 * Hitos más cercanos que esto se insertan como vértices de la polyline
 * (además de los via points) para densificar sin salirse de la calle.
 */
export const CIRCUIT_POLYLINE_MAX_LATERAL_M = 30;

export type CircuitProjection = {
  distAlongKm: number;
  lateralM: number;
  segmentIndex: number;
  t: number;
  projected: CircuitLatLng;
};

type Segment = {
  index: number;
  a: CircuitLatLng;
  b: CircuitLatLng;
  lengthKm: number;
  cumStartKm: number;
};

function buildSegments(
  vias: ReadonlyArray<CircuitLatLng> = MAP_CIRCUIT_VIA_POINTS
): { segments: Segment[]; totalKm: number } {
  const segments: Segment[] = [];
  let totalKm = 0;
  for (let i = 0; i < vias.length - 1; i++) {
    const a = vias[i];
    const b = vias[i + 1];
    const lengthKm = haversineDistanceKm(a, b);
    segments.push({ index: i, a, b, lengthKm, cumStartKm: totalKm });
    totalKm += lengthKm;
  }
  return { segments, totalKm };
}

const { segments: CIRCUIT_SEGMENTS, totalKm: CIRCUIT_TOTAL_KM } = buildSegments();

export function getCircuitTotalKm(): number {
  return CIRCUIT_TOTAL_KM;
}

/** Proyecta un punto sobre el trazo cerrado; lateralM es la distancia al segmento más cercano. */
export function projectOntoCircuit(point: CircuitLatLng): CircuitProjection {
  let best: CircuitProjection = {
    distAlongKm: 0,
    lateralM: Infinity,
    segmentIndex: 0,
    t: 0,
    projected: { latitude: CIRCUIT_SEGMENTS[0].a.latitude, longitude: CIRCUIT_SEGMENTS[0].a.longitude },
  };

  for (const seg of CIRCUIT_SEGMENTS) {
    const midLat = (seg.a.latitude + seg.b.latitude) / 2;
    const mPerDegLat = 111_320;
    const mPerDegLng = 111_320 * Math.cos((midLat * Math.PI) / 180);

    const bx = (seg.b.longitude - seg.a.longitude) * mPerDegLng;
    const by = (seg.b.latitude - seg.a.latitude) * mPerDegLat;
    const px = (point.longitude - seg.a.longitude) * mPerDegLng;
    const py = (point.latitude - seg.a.latitude) * mPerDegLat;
    const ab2 = bx * bx + by * by;
    let t = ab2 === 0 ? 0 : (px * bx + py * by) / ab2;
    t = Math.max(0, Math.min(1, t));

    const qx = t * bx;
    const qy = t * by;
    const lateralM = Math.hypot(px - qx, py - qy);
    const distAlongKm = seg.cumStartKm + t * seg.lengthKm;

    if (lateralM < best.lateralM) {
      best = {
        distAlongKm,
        lateralM,
        segmentIndex: seg.index,
        t,
        projected: {
          latitude: seg.a.latitude + t * (seg.b.latitude - seg.a.latitude),
          longitude: seg.a.longitude + t * (seg.b.longitude - seg.a.longitude),
        },
      };
    }
  }

  return best;
}

export type CircuitOrderedPoint<T extends CircuitLatLng> = T & {
  circuitDistAlongKm: number;
  circuitLateralM: number;
};

/**
 * Filtra puntos a más de `maxLateralM` del trazo y los ordena por avance
 * acumulado desde Via 1 (no por cercanía euclidiana libre).
 */
export function orderPointsByCircuitProgress<T extends CircuitLatLng>(
  points: T[],
  maxLateralM: number = CIRCUIT_INCLUDE_MAX_LATERAL_M
): CircuitOrderedPoint<T>[] {
  return points
    .map((p) => {
      const proj = projectOntoCircuit(p);
      return {
        ...p,
        circuitDistAlongKm: proj.distAlongKm,
        circuitLateralM: proj.lateralM,
      };
    })
    .filter((p) => p.circuitLateralM <= maxLateralM)
    .sort((a, b) => a.circuitDistAlongKm - b.circuitDistAlongKm);
}

type WalkVertex = { latitude: number; longitude: number; distAlongKm: number };

/**
 * Polyline estática: via points + coordenadas reales de hitos con off bajo
 * (no inserta hitos laterales altos para no jalar la línea fuera de la calle).
 */
export function buildCircuitWalkPath(
  routePoints: CircuitLatLng[],
  polylineMaxLateralM: number = CIRCUIT_POLYLINE_MAX_LATERAL_M
): Array<[number, number]> {
  const vertices: WalkVertex[] = MAP_CIRCUIT_VIA_POINTS.map((v, i) => {
    if (i === 0) {
      return { latitude: v.latitude, longitude: v.longitude, distAlongKm: 0 };
    }
    let cum = 0;
    for (let s = 0; s < i; s++) {
      cum += CIRCUIT_SEGMENTS[s]?.lengthKm ?? 0;
    }
    return { latitude: v.latitude, longitude: v.longitude, distAlongKm: cum };
  });

  for (const p of routePoints) {
    const proj = projectOntoCircuit(p);
    if (proj.lateralM > polylineMaxLateralM) continue;
    // Usa la posición real del hito (cerca de la calle) para densificar con naturalidad.
    vertices.push({
      latitude: p.latitude,
      longitude: p.longitude,
      distAlongKm: proj.distAlongKm,
    });
  }

  vertices.sort((a, b) => a.distAlongKm - b.distAlongKm);

  const path: Array<[number, number]> = [];
  for (const v of vertices) {
    const last = path[path.length - 1];
    if (last && last[0] === v.latitude && last[1] === v.longitude) continue;
    path.push([v.latitude, v.longitude]);
  }

  // Asegurar cierre en Via 1.
  const first = MAP_CIRCUIT_VIA_POINTS[0];
  const tail = path[path.length - 1];
  if (!tail || tail[0] !== first.latitude || tail[1] !== first.longitude) {
    path.push([first.latitude, first.longitude]);
  }

  return path;
}

/** Solo via points (fallback si aún no hay walkPath del servidor). */
export function circuitViaWalkPath(): Array<[number, number]> {
  return MAP_CIRCUIT_VIA_POINTS.map((v) => [v.latitude, v.longitude]);
}
