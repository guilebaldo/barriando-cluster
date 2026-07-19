import type { MembershipPlan } from "@/generated/prisma/client";

/**
 * Entitlements (negocio / paid directory):
 * - Vecino: BarrID, canjear beneficios, escanear sellos de pasaporte (no ofrece sello).
 * - Pequeña (NEGOCIO_FAMILIAR, $600+): directorio /socios + sello en Pasaporte Digital.
 * - Mediana: lo anterior + carrusel landing + orden preferente en /socios.
 * - Gran: lo anterior + pin de negocio en itinerario MAP.
 *
 * Todo plan de negocio ($600+) ofrece QR de sello de pasaporte.
 * Solo Gran Empresa aparece en el MAP.
 */
const DIRECTORY_PLANS: MembershipPlan[] = ["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const CAROUSEL_PLANS: MembershipPlan[] = ["MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const MAP_PLANS: MembershipPlan[] = ["GRAN_EMPRESA"];
const PASSPORT_STAMP_PLANS: MembershipPlan[] = [
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
];

/** Visible en el directorio /socios. */
export function isVisibleInSociosDirectory(plan: MembershipPlan): boolean {
  return DIRECTORY_PLANS.includes(plan);
}

/** Aparece en el carrusel destacado de la página principal. */
export function isVisibleInCarousel(plan: MembershipPlan): boolean {
  return CAROUSEL_PLANS.includes(plan);
}

/** Aparece en el carrusel de Mediana Empresa de la landing. */
export function isMedianaCarouselPlan(plan: MembershipPlan): boolean {
  return plan === "MEDIANA_EMPRESA";
}

/** Aparece como negocio premium en la ruta MAP interactiva (solo Gran Empresa). */
export function isVisibleOnMap(plan: MembershipPlan): boolean {
  return MAP_PLANS.includes(plan);
}

/** Plan de negocio ($600+) que ofrece sello / QR en el Pasaporte Digital. */
export function canOfferPassportStamp(plan: MembershipPlan | null | undefined): boolean {
  return Boolean(plan && PASSPORT_STAMP_PLANS.includes(plan));
}

/**
 * Giros históricamente asociados a campaña de temporada (Chiles en Nogada).
 * Ya no gatea la participación en pasaporte; se conserva para UI/campañas.
 */
export function isSeasonalStampCategory(category: string | null | undefined): boolean {
  return category === "Alimentos y Bebidas" || category === "Hotel";
}
