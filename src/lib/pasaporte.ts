import { listaSocios, type Socio } from "@/app/data/socios";
import { canOfferPassportStamp } from "@/lib/plan-visibility";

export const STAMP_COOLDOWN_MS = 18 * 60 * 60 * 1000;
export const STAMP_STATUS_VALIDATED = "validado";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Fallback estático: negocios del catálogo con plan de negocio ($600+).
 * Preferir getParticipatingRestaurantsAsync (roster activo).
 */
export function getParticipatingRestaurants(): Socio[] {
  return listaSocios.filter((s) => canOfferPassportStamp(s.membershipPlan ?? null));
}

/**
 * Negocios que ofrecen sello en el Pasaporte Digital:
 * todo plan de negocio activo ($600+: Familiar, Mediana, Gran).
 * Solo Gran Empresa aparece además en el MAP (ver plan-visibility).
 */
export async function getParticipatingRestaurantsAsync(): Promise<Socio[]> {
  // Dynamic import keeps Prisma/DATABASE_URL off the client bundle (/map, BarrID, etc.).
  const { getPublicSociosList } = await import("@/lib/public-socios");
  const publicList = await getPublicSociosList();
  const byName = new Map<string, Socio>();

  for (const socio of publicList) {
    if (!canOfferPassportStamp(socio.membershipPlan ?? null)) continue;
    const key = normalizeName(socio.name);
    if (!byName.has(key)) byName.set(key, socio);
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function restaurantSlug(socio: Pick<Socio, "name">): string {
  return socio.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findRestaurantBySlug(slug: string | null | undefined): Socio | null {
  if (!slug?.trim()) return null;
  const normalized = slug.trim().toLowerCase();
  const participants = getParticipatingRestaurants();

  const bySlug = participants.find((s) => restaurantSlug(s) === normalized);
  if (bySlug) return bySlug;

  const byFoto = participants.find((s) => s.foto.toLowerCase() === normalized);
  if (byFoto) return byFoto;

  const byId = participants.find((s) => String(s.id) === normalized);
  return byId ?? null;
}

export async function findRestaurantBySlugAsync(
  slug: string | null | undefined
): Promise<Socio | null> {
  if (!slug?.trim()) return null;
  const normalized = slug.trim().toLowerCase();
  const participants = await getParticipatingRestaurantsAsync();

  const bySlug = participants.find((s) => restaurantSlug(s) === normalized);
  if (bySlug) return bySlug;

  const byFoto = participants.find((s) => s.foto.toLowerCase() === normalized);
  if (byFoto) return byFoto;

  const byId = participants.find((s) => String(s.id) === normalized);
  return byId ?? null;
}

export type PassportRank = {
  id: "turista" | "poblano";
  label: string;
  isComplete: boolean;
};

export function getPassportRank(
  uniqueRestaurantsStamped: number,
  totalParticipating: number
): PassportRank {
  if (totalParticipating > 0 && uniqueRestaurantsStamped >= totalParticipating) {
    return { id: "poblano", label: "Poblano", isComplete: true };
  }
  return { id: "turista", label: "Turista", isComplete: false };
}

export function getPassportProgress(
  uniqueRestaurantsStamped: number,
  totalParticipating: number
): number {
  if (totalParticipating <= 0) return 0;
  return Math.min(100, Math.round((uniqueRestaurantsStamped / totalParticipating) * 100));
}

/** @deprecated Usar getPassportRank */
export type PoblanoTier = PassportRank & { minStamps: number; maxStamps: number | null };

/** @deprecated */
export function getPoblanoTier(totalStamps: number): PassportRank {
  return getPassportRank(totalStamps, 6);
}

/** @deprecated */
export function getPoblanoProgress(uniqueStamped: number, total = 6): number {
  return getPassportProgress(uniqueStamped, total);
}

export type StampSummary = {
  restaurantId: number;
  count: number;
  lastStampAt: string;
};

export function buildSellarPath(restaurantSlugValue: string): string {
  return `/pasaporte/sellar?restaurante=${encodeURIComponent(restaurantSlugValue)}`;
}

/** Ficha del socio en el directorio (sellos del pasaporte no siempre están en el MAP). */
export function getSociosHrefForRestaurant(socioId: number): string {
  return `/socios?socio=${socioId}`;
}

/** @deprecated Usa getSociosHrefForRestaurant — no todos los sellos aparecen en /map. */
export function getMapHrefForRestaurant(socioId: number): string {
  return getSociosHrefForRestaurant(socioId);
}

/** Guest landing after scanning a stamp QR — keeps sell intent for Google CTA. */
export function buildPasaportePendingStampPath(restaurantSlugValue: string): string {
  return `/pasaporte?pendiente=${encodeURIComponent(restaurantSlugValue)}`;
}

export function buildLoginRedirectPath(callbackPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
}
