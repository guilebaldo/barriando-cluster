import type { MembershipPlan } from "@/generated/prisma/client";

const DIRECTORY_PLANS: MembershipPlan[] = ["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const CAROUSEL_PLANS: MembershipPlan[] = ["GRAN_EMPRESA"];
const MAP_PLANS: MembershipPlan[] = ["GRAN_EMPRESA"];

/** Visible en el directorio /socios. */
export function isVisibleInSociosDirectory(plan: MembershipPlan): boolean {
  return DIRECTORY_PLANS.includes(plan);
}

/** Aparece en el carrusel destacado de la página principal. */
export function isVisibleInCarousel(plan: MembershipPlan): boolean {
  return CAROUSEL_PLANS.includes(plan);
}

/** Aparece como negocio premium en la ruta MAP interactiva. */
export function isVisibleOnMap(plan: MembershipPlan): boolean {
  return MAP_PLANS.includes(plan);
}
