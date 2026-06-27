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

export type PoblanoTier = {
  id: "visitante" | "cepa" | "heroe";
  label: string;
  minStamps: number;
  maxStamps: number | null;
};

export const POBLANO_TIERS: PoblanoTier[] = [
  { id: "visitante", label: "Visitante", minStamps: 0, maxStamps: 2 },
  { id: "cepa", label: "Poblano de Cepa", minStamps: 3, maxStamps: 5 },
  { id: "heroe", label: "Héroe del Ejército Trigarante", minStamps: 6, maxStamps: null },
];

export function getPoblanoTier(totalStamps: number): PoblanoTier {
  if (totalStamps >= 6) return POBLANO_TIERS[2];
  if (totalStamps >= 3) return POBLANO_TIERS[1];
  return POBLANO_TIERS[0];
}

export function getPoblanoProgress(totalStamps: number): number {
  const tier = getPoblanoTier(totalStamps);
  if (tier.id === "heroe") return 100;
  if (tier.id === "cepa") {
    return Math.min(100, Math.round(((totalStamps - 2) / 3) * 100));
  }
  return Math.min(100, Math.round((totalStamps / 2) * 100));
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
