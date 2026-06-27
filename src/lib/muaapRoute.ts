import { prisma } from "@/lib/prisma";
import { listaSocios } from "@/app/data/socios";
import { listaHitos } from "@/app/data/hitos";
import { sociosCoords } from "@/app/data/socios-coords";
import { extractLatLngFromMapsEmbed } from "@/lib/muaap-coords";
import { readFileSync } from "fs";
import path from "path";

export type MuaapPointKind = "milestone" | "premium_business";

export type MuaapRoutePoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
  kind: MuaapPointKind;
  order: number;
  category?: string;
};

export type MuaapRouteResult = {
  startName: string;
  points: MuaapRoutePoint[];
  totalStops: number;
  milestoneCount: number;
  premiumCount: number;
};

/** Teatro Principal — punto de partida canónico del recorrido MUAAP. */
export const MUAAP_ROUTE_START = {
  name: "Teatro Principal",
  latitude: 19.0446205,
  longitude: -98.1923828,
} as const;

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

type RawPoint = Omit<MuaapRoutePoint, "order">;

/** Vecino más cercano desde el punto actual; devuelve el resto sin visitar. */
export function nearestNeighborOrder(
  start: { latitude: number; longitude: number },
  points: RawPoint[]
): RawPoint[] {
  const remaining = [...points];
  const ordered: RawPoint[] = [];
  let current = start;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistanceKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = { latitude: next.latitude, longitude: next.longitude };
  }

  return ordered;
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

function loadFallbackMilestones(): RawPoint[] {
  try {
    const csvPath = path.join(process.cwd(), "data/barriando-muaap-hitos.csv");
    const raw = readFileSync(csvPath, "utf8");
    return parseCsvRows(raw)
      .map((row) => {
        const coords = extractLatLngFromMapsEmbed(row.html);
        if (!coords) return null;
        const socio = findSocioByName(row.name);
        return {
          id: `milestone-fallback-${normalizeName(row.name).replace(/\s+/g, "-")}`,
          name: row.name,
          latitude: coords.lat,
          longitude: coords.lng,
          mapsUrl: row.mapsUrl,
          kind: "milestone" as const,
          category: socio ? "Hito + Socio certificado" : "Hito patrimonial",
        };
      })
      .filter(Boolean) as RawPoint[];
  } catch {
    return [];
  }
}

async function loadActiveMilestones(): Promise<RawPoint[]> {
  try {
    const rows = await prisma.muaapMilestone.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    if (rows.length === 0) return loadFallbackMilestones();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      mapsUrl: row.mapsUrl,
      kind: "milestone" as const,
      category: row.businessId ? "Hito + Socio certificado" : "Hito patrimonial",
    }));
  } catch (error) {
    console.error("[muaap] loadActiveMilestones failed, using CSV fallback:", error);
    return loadFallbackMilestones();
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
    console.error("[muaap] loadPremiumGranEmpresaBusinesses failed:", error);
    return [];
  }
}

export async function buildMuaapRoute(): Promise<MuaapRouteResult> {
  const [milestones, premium] = await Promise.all([
    loadActiveMilestones(),
    loadPremiumGranEmpresaBusinesses(),
  ]);

  const startInList = milestones.find(
    (m) => normalizeName(m.name) === normalizeName(MUAAP_ROUTE_START.name)
  );

  const start = startInList
    ? { latitude: startInList.latitude, longitude: startInList.longitude }
    : { latitude: MUAAP_ROUTE_START.latitude, longitude: MUAAP_ROUTE_START.longitude };

  const pool = [...milestones, ...premium].filter(
    (p) => normalizeName(p.name) !== normalizeName(MUAAP_ROUTE_START.name)
  );

  const ordered = nearestNeighborOrder(start, pool);

  const allPoints: MuaapRoutePoint[] = [
    {
      id: startInList?.id ?? "start-teatro-principal",
      name: MUAAP_ROUTE_START.name,
      latitude: start.latitude,
      longitude: start.longitude,
      mapsUrl: startInList?.mapsUrl ?? "https://maps.app.goo.gl/TW2KJFauWXa3bJ7K8",
      kind: "milestone",
      order: 1,
      category: "Punto de partida",
    },
    ...ordered.map((p, idx) => ({ ...p, order: idx + 2 })),
  ];

  return {
    startName: MUAAP_ROUTE_START.name,
    points: allPoints,
    totalStops: allPoints.length,
    milestoneCount: allPoints.filter((p) => p.kind === "milestone").length,
    premiumCount: allPoints.filter((p) => p.kind === "premium_business").length,
  };
}

/** Utilidad para seed: filas del CSV con coordenadas resueltas. */
export function parseMuaapCsvFile(csvPath: string) {
  const raw = readFileSync(csvPath, "utf8");
  return parseCsvRows(raw)
    .map((row) => {
      const coords = extractLatLngFromMapsEmbed(row.html);
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
