import { prisma } from "@/lib/prisma";
import { listaSocios } from "@/app/data/socios";
import { listaHitos } from "@/app/data/hitos";
import { sociosCoords } from "@/app/data/socios-coords";
import { extractLatLngFromMapsEmbed } from "@/lib/muaap-coords";
import { readFileSync } from "fs";
import path from "path";
import type { MapPointKind, MapRoutePoint, MapRouteResult } from "@/lib/map-route-client";
import { haversineDistanceKm } from "@/lib/map-route-client";
import {
  buildCircuitWalkPath,
  MAP_CIRCUIT_START,
  orderPointsByCircuitProgress,
} from "@/lib/map-circuit";
import { getPlanForSocio } from "@/lib/membresia";
import { getParticipatingRestaurantsAsync } from "@/lib/pasaporte";
import { resolveSocioMapCoord } from "@/lib/socio-map-coords";

export type { MapPointKind, MapRoutePoint, MapRouteResult } from "@/lib/map-route-client";
export { findNearestRoutePoint, reorderRouteFromPoint, buildWalkingItinerary } from "@/lib/map-route-client";
export { MAP_CIRCUIT_START, MAP_CIRCUIT_VIA_POINTS } from "@/lib/map-circuit";

/**
 * @deprecated El recorrido ya no fuerza un hito de arranque editorial.
 * El inicio geométrico es Via 1 (`MAP_CIRCUIT_START`); GPS/bienvenida rotan al hito más cercano.
 * Se conserva el alias para código legacy MUAAP.
 */
export const MAP_ROUTE_START = {
  name: MAP_CIRCUIT_START.label,
  latitude: MAP_CIRCUIT_START.latitude,
  longitude: MAP_CIRCUIT_START.longitude,
} as const;

export { haversineDistanceKm };

type RawPoint = Omit<MapRoutePoint, "order">;

/**
 * @deprecated Reemplazado por `orderPointsByCircuitProgress` (trazo fijo del Centro Histórico).
 * Se conserva por exports legacy (`nearestNeighborOrder` / MUAAP).
 */
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

/** Socios Gran Empresa del catálogo + aliados destacados en el corredor MAP (p. ej. Cosme Tortas). */
const FEATURED_ROUTE_SOCIO_IDS = new Set([11]); // Cosme Tortas

function loadCatalogRouteBusinesses(): RawPoint[] {
  const points: RawPoint[] = [];
  const seenNames = new Set<string>();

  for (const socio of listaSocios) {
    const coord = sociosCoords[socio.id];
    if (!coord) continue;

    const plan = getPlanForSocio(socio);
    const featured = FEATURED_ROUTE_SOCIO_IDS.has(socio.id);
    if (plan !== "GRAN_EMPRESA" && !featured) continue;

    const nameKey = normalizeName(socio.name);
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);

    points.push({
      id: `premium-catalog-${socio.id}`,
      name: socio.name,
      latitude: coord.lat,
      longitude: coord.lng,
      mapsUrl: socio.direccion?.startsWith("http")
        ? socio.direccion
        : `https://www.google.com/maps?q=${coord.lat},${coord.lng}`,
      kind: "premium_business",
      category: featured ? `${socio.categoria} · Socio destacado` : socio.categoria,
      socioId: socio.id,
      hasSeasonalStamp: socio.categoria === "Alimentos y Bebidas",
    });
  }

  return points;
}

/** Restaurantes con sello de Pasaporte — siempre visibles en el MAP para deep links desde /pasaporte. */
async function loadStampRestaurantPoints(): Promise<RawPoint[]> {
  const points: RawPoint[] = [];
  const seenNames = new Set<string>();
  const restaurants = await getParticipatingRestaurantsAsync();

  for (const socio of restaurants) {
    const coord = resolveSocioMapCoord(socio);
    if (!coord) continue;

    const nameKey = normalizeName(socio.name);
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);

    points.push({
      id: `stamp-${socio.id}`,
      name: socio.name,
      latitude: coord.lat,
      longitude: coord.lng,
      mapsUrl: socio.direccion?.startsWith("http")
        ? socio.direccion
        : `https://www.google.com/maps?q=${coord.lat},${coord.lng}`,
      kind: "premium_business",
      category: `${socio.categoria} · Sello Pasaporte`,
      socioId: socio.id,
      hasSeasonalStamp: true,
      stampLogoSrc: socio.logoUrl?.trim() || `/logos/${socio.foto}.png`,
    });
  }

  return points;
}

async function loadPremiumGranEmpresaBusinesses(): Promise<RawPoint[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        subscription: {
          plan: "GRAN_EMPRESA",
          status: { in: ["active", "manual_active"] },
        },
        socioProfile: { linkageStatus: "approved" },
      },
      select: {
        socioId: true,
        socioProfile: {
          select: {
            businessName: true,
            linkageStatus: true,
            latitude: true,
            longitude: true,
            address: true,
          },
        },
      },
    });

    const points: RawPoint[] = [];
    const seen = new Set<number>();

    for (const user of users) {
      const profile = user.socioProfile;
      if (!profile || profile.linkageStatus !== "approved") continue;

      if (user.socioId != null && !seen.has(user.socioId)) {
        const catalog = listaSocios.find((s) => s.id === user.socioId);
        const coord = sociosCoords[user.socioId];
        if (catalog && coord) {
          seen.add(user.socioId);
          points.push({
            id: `premium-${user.socioId}`,
            name: profile.businessName?.trim() || catalog.name,
            latitude: coord.lat,
            longitude: coord.lng,
            mapsUrl: catalog.direccion || `https://www.google.com/maps?q=${coord.lat},${coord.lng}`,
            kind: "premium_business",
            category: catalog.categoria,
            socioId: user.socioId,
            hasSeasonalStamp: catalog.categoria === "Alimentos y Bebidas",
          });
        }
        continue;
      }

      if (profile.latitude != null && profile.longitude != null) {
        const id = `premium-manual-${user.socioId ?? profile.businessName}`;
        points.push({
          id,
          name: profile.businessName?.trim() || "Socio certificado",
          latitude: profile.latitude,
          longitude: profile.longitude,
          mapsUrl:
            profile.address?.trim() ||
            `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`,
          kind: "premium_business",
          category: "Negocio certificado",
        });
      }
    }

    return points;
  } catch (error) {
    console.error("[map] loadPremiumGranEmpresaBusinesses failed:", error);
    return [];
  }
}

export async function buildMapRoute(): Promise<MapRouteResult> {
  const [milestones, premiumDb, premiumCatalog, stampRestaurants] = await Promise.all([
    loadActiveMilestones(),
    loadPremiumGranEmpresaBusinesses(),
    Promise.resolve(loadCatalogRouteBusinesses()),
    loadStampRestaurantPoints(),
  ]);

  const premiumByName = new Map<string, RawPoint>();
  for (const p of [...premiumDb, ...premiumCatalog, ...stampRestaurants]) {
    premiumByName.set(normalizeName(p.name), p);
  }
  const premium = [...premiumByName.values()];

  const pool = [...milestones, ...premium].filter((p) => {
    // Evitar duplicar hito y socio con el mismo nombre en el pool.
    const nameKey = normalizeName(p.name);
    if (p.kind === "premium_business") {
      const milestoneDup = milestones.some((m) => normalizeName(m.name) === nameKey);
      if (milestoneDup) return false;
    }
    return true;
  });

  const ordered = orderPointsByCircuitProgress(pool);
  const allPoints: MapRoutePoint[] = ordered.map((p, idx) => ({
    id: p.id,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    mapsUrl: p.mapsUrl,
    kind: p.kind,
    order: idx + 1,
    category:
      idx === 0 && p.kind === "milestone" && !p.category?.includes("Socio")
        ? "Primera parada del circuito"
        : p.category,
    zone: p.zone,
    socioId: p.socioId,
    hasSeasonalStamp: p.hasSeasonalStamp,
    stampLogoSrc: p.stampLogoSrc,
  }));

  // Polyline fija (via points + hitos densificadores). No usa OSRM / Directions.
  const walkPath = buildCircuitWalkPath(allPoints);

  return {
    startName: allPoints[0]?.name ?? MAP_CIRCUIT_START.label,
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
