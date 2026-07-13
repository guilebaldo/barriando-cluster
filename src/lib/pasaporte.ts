import { listaSocios, type Socio } from "@/app/data/socios";
import { getPublicSociosList } from "@/lib/public-socios";

export const STAMP_COOLDOWN_MS = 18 * 60 * 60 * 1000;
export const STAMP_STATUS_VALIDATED = "validado";

const FOOD_CATEGORY = "Alimentos y Bebidas";

function isFoodAndDrink(socio: Socio): boolean {
  return socio.categoria.trim().toLowerCase() === FOOD_CATEGORY.toLowerCase();
}

/**
 * Catálogo estático de restaurantes (sin DB).
 * Preferir `getParticipatingRestaurants()` async para incluir socios pagados.
 */
export function getCatalogParticipatingRestaurants(): Socio[] {
  return listaSocios.filter(isFoodAndDrink);
}

/** @deprecated Usar getParticipatingRestaurants async */
export function getParticipatingRestaurantsSync(): Socio[] {
  return getCatalogParticipatingRestaurants();
}

/**
 * Restaurantes del pasaporte: catálogo público + negocios con membresía comercial
 * activa en categoría Alimentos y Bebidas (mismo universo que /socios).
 */
export async function getParticipatingRestaurants(): Promise<Socio[]> {
  const publicList = await getPublicSociosList();
  return publicList.filter(isFoodAndDrink).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function restaurantSlug(socio: Socio): string {
  return socio.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function findRestaurantBySlug(slug: string | null | undefined): Promise<Socio | null> {
  if (!slug?.trim()) return null;
  const normalized = slug.trim().toLowerCase();
  const participants = await getParticipatingRestaurants();

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

export function buildSellarPath(restaurantSlug: string): string {
  return `/pasaporte/sellar?restaurante=${encodeURIComponent(restaurantSlug)}`;
}

export function getMapHrefForRestaurant(socioId: number): string {
  return `/map?socio=${socioId}`;
}

export function buildLoginRedirectPath(sellarPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(sellarPath)}`;
}
