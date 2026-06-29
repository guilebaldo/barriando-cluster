import { listaSocios, type Socio } from "@/app/data/socios";

export const STAMP_COOLDOWN_MS = 18 * 60 * 60 * 1000;
export const STAMP_STATUS_VALIDATED = "validado";

/** Restaurantes participantes en la temporada de chiles en nogada. */
export function getParticipatingRestaurants(): Socio[] {
  return listaSocios.filter((s) => s.categoria === "Alimentos y Bebidas");
}

export function restaurantSlug(socio: Socio): string {
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

export function buildLoginRedirectPath(sellarPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(sellarPath)}`;
}
