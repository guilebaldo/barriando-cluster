/**
 * Sync catalog metadata + CatalogMembership from data/miembros_barriando.csv
 *
 * Usage:
 *   npx tsx scripts/sync-catalog-memberships.ts [path/to.csv]
 *   npx tsx scripts/sync-catalog-memberships.ts --db-only
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import type { MembershipPlan } from "../src/generated/prisma/client";

const root = process.cwd();
const csvPath =
  process.argv.find((a) => a.endsWith(".csv")) || path.join(root, "data/miembros_barriando.csv");
const dbOnly = process.argv.includes("--db-only");

const PLAN_MAP: Record<string, MembershipPlan> = {
  pequena: "NEGOCIO_FAMILIAR",
  pequenha: "NEGOCIO_FAMILIAR",
  mediana: "MEDIANA_EMPRESA",
  gran: "GRAN_EMPRESA",
  grande: "GRAN_EMPRESA",
};

const PAY_MAP: Record<string, string> = {
  transferencia: "transfer",
  efectivo: "cash",
  stripe: "stripe",
  oxxo: "oxxo",
};

const COORD_OVERRIDES: Record<string, { lat: number; lng: number }> = {
  attico: { lat: 19.043492, lng: -98.199249 },
  colonial: { lat: 19.042412, lng: -98.196001 },
  furlong: { lat: 19.046122695455082, lng: -98.1942450590708 },
};

type CsvRow = {
  foto: string;
  name: string;
  url: string;
  categoria: string;
  direccion: string;
  embed: string;
  coordenadas: string;
  plan: MembershipPlan;
  paymentMethod: string | null;
};

type SocioRow = CsvRow & {
  id: number;
  coords: { lat: number; lng: number } | null;
};

function normalizeKey(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toHttps(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "#";
  if (u.startsWith("http://")) return `https://${u.slice(7)}`;
  if (u.startsWith("https://")) return u;
  return `https://${u}`;
}

function mapPlan(raw: string): MembershipPlan {
  const key = normalizeKey(raw).replace(/\s+/g, "").replace("ñ", "n");
  return PLAN_MAP[key] || "NEGOCIO_FAMILIAR";
}

function mapPayment(raw: string): string | null {
  const key = normalizeKey(raw).replace(/\s+/g, "");
  return PAY_MAP[key] || null;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    return obj;
  });
}

function parseCoordsField(raw: string): { lat: number; lng: number } | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const m = s.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function extractLatLngFromEmbed(html: string): { lat: number; lng: number } | null {
  const m = String(html || "").match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
  if (!m) return null;
  const lng = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function loadExistingFotoIds(): Map<string, number> {
  try {
    const src = readFileSync(path.join(root, "src/app/data/socios.ts"), "utf8");
    const map = new Map<string, number>();
    const re =
      /id:\s*(\d+),\s*name:\s*"([^"]*)",\s*categoria:\s*"([^"]*)",\s*foto:\s*"([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(src))) {
      map.set(match[4], Number(match[1]));
    }
    return map;
  } catch {
    return new Map();
  }
}

function loadCsvRows(): CsvRow[] {
  const records = parseCsv(readFileSync(csvPath, "utf8"));
  return records
    .map((row) => ({
      foto: String(row["nombre foto"] || row.foto || "").trim(),
      name: String(row["nombre negocio"] || row.name || "").trim(),
      url: toHttps(row.link || row.url || ""),
      categoria: String(row.giro || row.categoria || "Negocio certificado").trim(),
      direccion: String(row.ubicacion_google_maps || row.direccion || "").trim(),
      embed: String(row.mapa_html || "").trim(),
      coordenadas: String(row.coordenadas || "").trim(),
      plan: mapPlan(row.membresia_negocio || row.plan || ""),
      paymentMethod: mapPayment(row.pago || ""),
    }))
    .filter((r) => r.foto && r.name);
}

function resolveCoords(row: CsvRow): { lat: number; lng: number } | null {
  return (
    COORD_OVERRIDES[row.foto] ||
    parseCoordsField(row.coordenadas) ||
    extractLatLngFromEmbed(row.embed) ||
    null
  );
}

function writeSociosTs(socios: SocioRow[]) {
  const body = socios
    .map(
      (s) => `  {
    id: ${s.id},
    name: ${JSON.stringify(s.name)},
    categoria: ${JSON.stringify(s.categoria)},
    foto: ${JSON.stringify(s.foto)},
    url: ${JSON.stringify(s.url)},
    direccion: ${JSON.stringify(s.direccion)}
  }`
    )
    .join(",\n");

  const content = `export interface SocioBenefitInfo {
  title: string;
  description: string;
  howToRedeem: string;
  redeemViaQr: boolean;
  validFrom: string | null;
  validUntil: string | null;
}

export interface Socio {
  id: number;
  name: string;
  categoria: string;
  foto: string;
  url: string;
  direccion?: string;
  telefono?: string;
  /** Coordenadas comerciales del perfil (Places / registro). Prioridad sobre socios-coords. */
  latitude?: number | null;
  longitude?: number | null;
  logoUrl?: string | null;
  /** Beneficio activo para socios de pago (solo si el negocio lo publicó). */
  benefit?: SocioBenefitInfo | null;
  /** Plan del roster pagado (CatalogMembership / suscripción vinculada). */
  membershipPlan?: "NEGOCIO_FAMILIAR" | "MEDIANA_EMPRESA" | "GRAN_EMPRESA" | "VECINO" | null;
}

export const listaSocios: Socio[] = [
${body},
];
`;

  writeFileSync(path.join(root, "src/app/data/socios.ts"), content);
}

function writeCoordsTs(socios: SocioRow[]) {
  const entries = socios
    .filter((s) => s.coords)
    .map(
      (s) => `  "${s.id}": {
    "lat": ${s.coords!.lat},
    "lng": ${s.coords!.lng},
    "name": ${JSON.stringify(s.name)}
  }`
    )
    .join(",\n");

  const content = `// Coordenadas extraídas de Google Maps embed / CSV (miembros_barriando)
export interface SocioCoord {
  lat: number;
  lng: number;
  name: string;
}

export const sociosCoords: Record<number, SocioCoord> = {
${entries}
};
`;
  writeFileSync(path.join(root, "src/app/data/socios-coords.ts"), content);
}

async function syncMemberships(socios: SocioRow[]) {
  const activeIds = new Set(socios.map((s) => s.id));

  for (const s of socios) {
    await prisma.catalogMembership.upsert({
      where: { socioId: s.id },
      create: {
        socioId: s.id,
        plan: s.plan,
        paymentMethod: s.paymentMethod,
        status: "active",
        businessName: s.name,
      },
      update: {
        plan: s.plan,
        paymentMethod: s.paymentMethod,
        status: "active",
        businessName: s.name,
      },
    });
  }

  const existing = await prisma.catalogMembership.findMany({ select: { socioId: true } });
  const toDeactivate = existing.filter((e) => !activeIds.has(e.socioId)).map((e) => e.socioId);
  if (toDeactivate.length) {
    await prisma.catalogMembership.updateMany({
      where: { socioId: { in: toDeactivate } },
      data: { status: "inactive" },
    });
  }

  function namesReferToSameBusiness(a: string, b: string): boolean {
    const na = normalizeKey(a);
    const nb = normalizeKey(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
    if (short.length < 4) return false;
    return long.startsWith(`${short} `) || long.endsWith(` ${short}`) || long.includes(` ${short} `);
  }

  const phantoms = await prisma.user.findMany({
    where: {
      socioId: null,
      socioProfile: {
        isManualEntry: true,
        businessName: { not: null },
      },
    },
    select: {
      id: true,
      socioProfile: { select: { businessName: true, id: true } },
    },
  });

  let linked = 0;
  for (const user of phantoms) {
    const name = user.socioProfile?.businessName || "";
    if (!name || !user.socioProfile) continue;
    const matches = socios.filter((s) => namesReferToSameBusiness(s.name, name));
    if (matches.length !== 1) continue;
    const match = matches[0]!;
    await prisma.user.update({
      where: { id: user.id },
      data: { socioId: match.id },
    });
    await prisma.socioProfile.update({
      where: { id: user.socioProfile.id },
      data: {
        businessName: match.name,
        category: match.categoria,
        website: match.url === "#" ? undefined : match.url,
        googleBusinessUrl: match.direccion || undefined,
        latitude: match.coords?.lat ?? undefined,
        longitude: match.coords?.lng ?? undefined,
        logoUrl: `/logos/${match.foto}.png`,
        linkageStatus: "approved",
      },
    });
    linked += 1;
  }

  console.log(
    `CatalogMembership: ${socios.length} active, ${toDeactivate.length} inactive, ${linked} manual profiles linked to catalog`
  );
}

async function main() {
  const rows = loadCsvRows();
  if (!rows.length) throw new Error(`No rows parsed from ${csvPath}`);

  const existingIds = loadExistingFotoIds();
  let nextId = Math.max(0, ...existingIds.values(), 0) + 1;

  const socios: SocioRow[] = rows.map((row) => {
    let id = existingIds.get(row.foto);
    if (id == null) {
      id = nextId++;
      existingIds.set(row.foto, id);
    }
    return { ...row, id, coords: resolveCoords(row) };
  });

  socios.sort((a, b) => a.id - b.id);

  if (!dbOnly) {
    writeSociosTs(socios);
    writeCoordsTs(socios);
    console.log(`Wrote listaSocios (${socios.length}) and socios-coords`);
  }

  await syncMemberships(socios);
  console.log(`Done. Source: ${csvPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
