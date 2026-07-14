import type { MembershipPlan } from "@/generated/prisma/client";

/**
 * Entitlements (negocio / paid directory):
 * - Vecino: BarrID, canjear beneficios, escanear sellos de pasaporte (no ofrece sello AyB).
 * - Pequeña (NEGOCIO_FAMILIAR): lo de Vecino/Turista + puede aparecer como sello AyB en pasaporte.
 * - Mediana: lo anterior + carrusel landing + orden preferente en /socios.
 * - Gran: lo anterior + pin de negocio en itinerario MAP.
 */
const DIRECTORY_PLANS: MembershipPlan[] = ["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const CAROUSEL_PLANS: MembershipPlan[] = ["MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const MAP_PLANS: MembershipPlan[] = ["GRAN_EMPRESA"];

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

/** Aparece como negocio premium en la ruta MAP interactiva. */
export function isVisibleOnMap(plan: MembershipPlan): boolean {
  return MAP_PLANS.includes(plan);
}
