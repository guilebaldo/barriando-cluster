import { prisma } from "@/lib/prisma";
import { listaSocios } from "@/app/data/socios";
import { listaHitos } from "@/app/data/hitos";
import { sociosCoords } from "@/app/data/socios-coords";
import { extractLatLngFromMapsEmbed } from "@/lib/muaap-coords";
import { buildWalkingPath, type WalkLatLng } from "@/lib/muaap-walking-route";
import { readFileSync } from "fs";
import path from "path";
import type { MapPointKind, MapRoutePoint, MapRouteResult } from "@/lib/map-route-client";
import { haversineDistanceKm } from "@/lib/map-route-client";

export type { MapPointKind, MapRoutePoint, MapRouteResult } from "@/lib/map-route-client";
export { findNearestRoutePoint, reorderRouteFromPoint } from "@/lib/map-route-client";

/** Teatro Principal — punto de partida canónico del MAP. */
export const MAP_ROUTE_START = {
  name: "Teatro Principal",
  latitude: 19.0446205,
  longitude: -98.1923828,
} as const;

export { haversineDistanceKm };

type RawPoint = Omit<MapRoutePoint, "order">;

/** Orden serpenteante peatonal (cuadrante): filas N→S, alternando O→P y P→O. */
export function quadrantPedestrianOrder(
  start: { latitude: number; longitude: number },
  points: RawPoint[]
): RawPoint[] {
  if (points.length <= 1) return [...points];

  const sorted = [...points].sort((a, b) => b.latitude - a.latitude);
  const latSpan =
    Math.max(...sorted.map((p) => p.latitude)) - Math.min(...sorted.map((p) => p.latitude));
  const bandHeight = Math.max(latSpan / 6, 0.0008);

  const rows: RawPoint[][] = [];
  let currentRow: RawPoint[] = [];
  let rowLat = sorted[0].latitude;

  for (const p of sorted) {
    if (currentRow.length === 0 || Math.abs(p.latitude - rowLat) <= bandHeight) {
      currentRow.push(p);
    } else {
      rows.push(currentRow);
      currentRow = [p];
      rowLat = p.latitude;
    }
  }
  if (currentRow.length) rows.push(currentRow);

  const ordered: RawPoint[] = [];
  rows.forEach((row, i) => {
    const sortedRow = [...row].sort((a, b) =>
      i % 2 === 0 ? b.longitude - a.longitude : a.longitude - b.longitude
    );
    ordered.push(...sortedRow);
  });

  return rotateToNearestStart(start, ordered);
}

function rotateToNearestStart(
  start: { latitude: number; longitude: number },
  ordered: RawPoint[]
): RawPoint[] {
  if (ordered.length === 0) return ordered;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < ordered.length; i++) {
    const d = haversineDistanceKm(start, ordered[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return [...ordered.slice(bestIdx), ...ordered.slice(0, bestIdx)];
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findHitoZone(name: string): number | undefined {
  const target = normalizeName(name);
  const hito = listaHitos.find((h) => normalizeName(h.nombre) === target);
  return hito?.zona;
}

function findSocioByName(name: string) {
  const target = normalizeName(name);
  return listaSocios.find((s) => normalizeName(s.name) === target);
}

function parseCsvRows(raw: string): Array<{ name: string; mapsUrl: string; html: string }> {
  const lines = raw.trim().split("\n").slice(1);
  const rows: Array<{ name: string; mapsUrl: string; html: string }> = [];

  for (const line of lines) {
    const firstComma = line.indexOf(",");
    const secondComma = line.indexOf(",", firstComma + 1);
    if (firstComma < 0 || secondComma < 0) continue;

    const name = line.slice(0, firstComma).trim();
    const mapsUrl = line.slice(firstComma + 1, secondComma).trim();
    let html = line.slice(secondComma + 1).trim();
    if (html.startsWith('"') && html.endsWith('"')) {
      html = html.slice(1, -1).replace(/""/g, '"');
    }
    if (!name || !mapsUrl) continue;
    rows.push({ name, mapsUrl, html });
  }

  return rows;
}

function loadResolvedCoordsLookup(): Record<string, { lat: number; lng: number }> {
  try {
    const jsonPath = path.join(process.cwd(), "data/muaap-resolved-coords.json");
    const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as Record<
      string,
      { lat: number; lng: number }
    >;
    return raw;
  } catch {
    return {};
  }
}

function coordsForMilestone(
  name: string,
  html: string,
  resolved: Record<string, { lat: number; lng: number }>
): { lat: number; lng: number } | null {
  const pinned = resolved[name];
  if (pinned) return { lat: pinned.lat, lng: pinned.lng };
  const fromEmbed = extractLatLngFromMapsEmbed(html);
  return fromEmbed ? { lat: fromEmbed.lat, lng: fromEmbed.lng } : null;
}

function loadCsvMilestones(): RawPoint[] {
  try {
    const csvPath = path.join(process.cwd(), "data/barriando-muaap-hitos.csv");
    const raw = readFileSync(csvPath, "utf8");
    const resolved = loadResolvedCoordsLookup();
    return parseCsvRows(raw)
      .map((row) => {
        const coords = coordsForMilestone(row.name, row.html, resolved);
        if (!coords) return null;
        const socio = findSocioByName(row.name);
        return {
          id: `milestone-${normalizeName(row.name).replace(/\s+/g, "-")}`,
          name: row.name,
          latitude: coords.lat,
          longitude: coords.lng,
          mapsUrl: row.mapsUrl,
          kind: "milestone" as const,
          category: socio ? "Hito + Socio certificado" : "Hito patrimonial",
          zone: findHitoZone(row.name),
        };
      })
      .filter(Boolean) as RawPoint[];
  } catch {
    return [];
  }
}

async function loadActiveMilestones(): Promise<RawPoint[]> {
  const fromCsv = loadCsvMilestones();
  if (fromCsv.length > 0) return fromCsv;

  try {
    const rows = await prisma.mapMilestone.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      mapsUrl: row.mapsUrl,
      kind: "milestone" as const,
      category: row.businessId ? "Hito + Socio certificado" : "Hito patrimonial",
      zone: row.zone ?? findHitoZone(row.name),
    }));
  } catch (error) {
    console.error("[map] loadActiveMilestones failed:", error);
    return [];
  }
}

async function loadPremiumGranEmpresaBusinesses(): Promise<RawPoint[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        socioId: { not: null },
        subscription: {
          plan: "GRAN_EMPRESA",
          status: { in: ["active", "manual_active"] },
        },
        OR: [
          { socioProfile: { linkageStatus: "approved" } },
          { socioProfile: null },
        ],
      },
      select: {
        socioId: true,
        socioProfile: { select: { businessName: true, linkageStatus: true } },
      },
    });

    const points: RawPoint[] = [];
    const seen = new Set<number>();

    for (const user of users) {
      const socioId = user.socioId;
      if (socioId == null || seen.has(socioId)) continue;
      if (user.socioProfile && user.socioProfile.linkageStatus !== "approved") continue;

      const catalog = listaSocios.find((s) => s.id === socioId);
      const coord = sociosCoords[socioId];
      if (!catalog || !coord) continue;

      seen.add(socioId);
      points.push({
        id: `premium-${socioId}`,
        name: user.socioProfile?.businessName?.trim() || catalog.name,
        latitude: coord.lat,
        longitude: coord.lng,
        mapsUrl: catalog.direccion || `https://www.google.com/maps?q=${coord.lat},${coord.lng}`,
        kind: "premium_business",
        category: catalog.categoria,
      });
    }

    return points;
  } catch (error) {
    console.error("[map] loadPremiumGranEmpresaBusinesses failed:", error);
    return [];
  }
}

export async function buildMapRoute(): Promise<MapRouteResult> {
  const [milestones, premium] = await Promise.all([
    loadActiveMilestones(),
    loadPremiumGranEmpresaBusinesses(),
  ]);

  const startInList = milestones.find(
    (m) => normalizeName(m.name) === normalizeName(MAP_ROUTE_START.name)
  );

  const start = startInList
    ? { latitude: startInList.latitude, longitude: startInList.longitude }
    : { latitude: MAP_ROUTE_START.latitude, longitude: MAP_ROUTE_START.longitude };

  const pool = [...milestones, ...premium].filter(
    (p) => normalizeName(p.name) !== normalizeName(MAP_ROUTE_START.name)
  );

  const ordered = quadrantPedestrianOrder(start, pool);

  const allPoints: MapRoutePoint[] = [
    {
      id: startInList?.id ?? "start-teatro-principal",
      name: MAP_ROUTE_START.name,
      latitude: start.latitude,
      longitude: start.longitude,
      mapsUrl: startInList?.mapsUrl ?? "https://maps.app.goo.gl/TW2KJFauWXa3bJ7K8",
      kind: "milestone",
      order: 1,
      category: "Punto de partida",
      zone: startInList?.zone ?? 1,
    },
    ...ordered.map((p, idx) => ({ ...p, order: idx + 2 })),
  ];

  let walkPath: WalkLatLng[] = [];
  try {
    walkPath = await buildWalkingPath(allPoints);
  } catch (error) {
    console.error("[map] buildWalkingPath failed:", error);
    walkPath = allPoints.map((p) => [p.latitude, p.longitude] as WalkLatLng);
  }

  return {
    startName: MAP_ROUTE_START.name,
    points: allPoints,
    walkPath,
    totalStops: allPoints.length,
    milestoneCount: allPoints.filter((p) => p.kind === "milestone").length,
    premiumCount: allPoints.filter((p) => p.kind === "premium_business").length,
  };
}

/** Utilidad para seed: filas del CSV con coordenadas resueltas. */
export function parseMapCsvFile(csvPath: string) {
  const raw = readFileSync(csvPath, "utf8");
  const resolved = loadResolvedCoordsLookup();
  return parseCsvRows(raw)
    .map((row) => {
      const coords = coordsForMilestone(row.name, row.html, resolved);
      if (!coords) return null;
      const hito = listaHitos.find((h) => normalizeName(h.nombre) === normalizeName(row.name));
      const socio = hito?.socioId ? listaSocios.find((s) => s.id === hito.socioId) : findSocioByName(row.name);
      return {
        name: row.name,
        mapsUrl: row.mapsUrl,
        latitude: coords.lat,
        longitude: coords.lng,
        zone: hito?.zona ?? findHitoZone(row.name),
        businessId: socio?.id ?? null,
      };
    })
    .filter(Boolean) as Array<{
    name: string;
    mapsUrl: string;
    latitude: number;
    longitude: number;
    zone?: number;
    businessId: number | null;
  }>;
}

// --- Aliases legacy MUAAP ---
export const MUAAP_ROUTE_START = MAP_ROUTE_START;
export type MuaapPointKind = MapPointKind;
export type MuaapRoutePoint = MapRoutePoint;
export type MuaapRouteResult = MapRouteResult;
export const buildMuaapRoute = buildMapRoute;
export const parseMuaapCsvFile = parseMapCsvFile;
export const nearestNeighborOrder = quadrantPedestrianOrder;
