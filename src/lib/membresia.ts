import type { MembershipPlan } from "@/generated/prisma/client";
import type { Socio } from "@/app/data/socios";

/**
 * Matriz de productos (resumen):
 * Turista — pasaporte / sellar (gratis).
 * Vecino — BarrID + canjear beneficios de negocios + escanear sellos.
 * Pequeña — lo de Vecino + aparece en directorio de socios.
 * Mediana — lo de Pequeña + carrusel landing + posición preferente en directorio.
 * Gran — lo de Mediana + pin en el MAP. Todo negocio $600+ ofrece sello en Pasaporte.
 */
export type PaidMembershipPlan = Exclude<MembershipPlan, "TURISTA">;

export interface PlanDefinition {
  id: MembershipPlan;
  label: string;
  tagline: string;
  description: string;
  isPaid: boolean;
  benefits: string[];
  highlight?: string;
}

export const MEMBERSHIP_PLANS: Record<MembershipPlan, PlanDefinition> = {
  TURISTA: {
    id: "TURISTA",
    label: "Turista",
    tagline: "Entra gratis al barrio",
    description: "Empieza a recorrer el Centro Histórico hoy. Cuando quieras más, sube a Vecino.",
    isPaid: false,
    benefits: [
      "Pasaporte Digital y sellos de temporada",
      "Circuito peatonal del MAP",
      "Novedades y convocatorias del Clúster",
    ],
  },
  VECINO: {
    id: "VECINO",
    label: "Vecino",
    tagline: "Vive el barrio con privilegios",
    description: "Deja de solo visitar: canjea ofertas reales y acredita tu identidad local.",
    isPaid: true,
    highlight: "El upgrade natural si ya tienes Pasaporte",
    benefits: [
      "BarrID: tu credencial digital de vecino",
      "Canjea beneficios exclusivos en negocios socios",
      "Prioridad en eventos y activaciones del Clúster",
      "Incluye Pasaporte Digital y MAP",
    ],
  },
  NEGOCIO_FAMILIAR: {
    id: "NEGOCIO_FAMILIAR",
    label: "Negocio Familiar",
    tagline: "Que te encuentren en el barrio",
    description: "Tu primer lugar en la red certificada: visibilidad local sin perder el trato de barrio.",
    isPaid: true,
    highlight: "Ideal para cafés, talleres y comercios de la traza",
    benefits: [
      "Ficha certificada en el directorio de socios",
      "Sello en Pasaporte Digital con QR descargable",
      "Publica beneficios para vecinos y turistas",
      "BarrID para validar canjes en tu negocio",
    ],
  },
  MEDIANA_EMPRESA: {
    id: "MEDIANA_EMPRESA",
    label: "Mediana Empresa",
    tagline: "Que te vean antes que al resto",
    description: "Más exposición donde importa: la portada y el directorio que ya visitan miles.",
    isPaid: true,
    highlight: "El plan más elegido para crecer en Barriando",
    benefits: [
      "Logo en el carrusel de la página principal",
      "Sello en Pasaporte Digital con QR",
      "Posición preferente en el directorio de socios",
      "Incluye directorio, beneficios y BarrID",
    ],
  },
  GRAN_EMPRESA: {
    id: "GRAN_EMPRESA",
    label: "Gran Empresa",
    tagline: "Domina el circuito del MAP",
    description: "Máxima exposición: los visitantes te encuentran caminando la ruta oficial del Centro.",
    isPaid: true,
    highlight: "Para hoteles y restaurantes que quieren el flujo del MAP",
    benefits: [
      "Pin propio en el MAP y rutas oficiales",
      "Sello en Pasaporte Digital con QR",
      "Máxima prioridad en carrusel y directorio",
      "Incluye todo lo de Mediana Empresa",
    ],
  },
};

export const PAID_PLANS: PaidMembershipPlan[] = [
  "VECINO",
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
];

/** Precios mensuales en MXN (mostrar en panel / planes). */
export const PLAN_PRICES_MXN: Record<PaidMembershipPlan, number> = {
  VECINO: 350,
  NEGOCIO_FAMILIAR: 600,
  MEDIANA_EMPRESA: 950,
  GRAN_EMPRESA: 1500,
};

export function formatPlanPriceMxn(plan: PaidMembershipPlan): string {
  const amount = PLAN_PRICES_MXN[plan];
  if (!amount) return "—";
  return `$${amount.toLocaleString("es-MX")} MXN / mes`;
}

export const COMMERCIAL_BENEFITS = [
  "Ficha certificada en el directorio de socios",
  "Logo en el carrusel de la página principal (Mediana y Gran Empresa)",
  "Pin en el MAP y rutas oficiales (Gran Empresa)",
  "Publicar beneficios y entradas en el blog del Clúster",
];

const PLAN_DISPLAY_ORDER: Record<PaidMembershipPlan, number> = {
  GRAN_EMPRESA: 0,
  MEDIANA_EMPRESA: 1,
  NEGOCIO_FAMILIAR: 2,
  VECINO: 3,
};

/** Ordena socios: Gran Empresa → Mediana → Negocio Familiar, luego alfabético. */
export function compareSociosByPlan(a: Socio, b: Socio): number {
  const orderDiff = PLAN_DISPLAY_ORDER[getPlanForSocio(a)] - PLAN_DISPLAY_ORDER[getPlanForSocio(b)];
  if (orderDiff !== 0) return orderDiff;
  return a.name.localeCompare(b.name, "es");
}

/** Asigna nivel de pago: roster/suscripción si existe; si no, heurística por categoría. */
export function getPlanForSocio(socio: Socio): PaidMembershipPlan {
  const rosterPlan = socio.membershipPlan;
  if (
    rosterPlan === "NEGOCIO_FAMILIAR" ||
    rosterPlan === "MEDIANA_EMPRESA" ||
    rosterPlan === "GRAN_EMPRESA" ||
    rosterPlan === "VECINO"
  ) {
    return rosterPlan;
  }
  if (
    socio.categoria === "Hospedaje" ||
    socio.categoria === "Hotel" ||
    socio.categoria === "Hospital"
  ) {
    return "GRAN_EMPRESA";
  }
  if (["Museo", "Educación", "Servicios"].includes(socio.categoria)) {
    return "MEDIANA_EMPRESA";
  }
  return "NEGOCIO_FAMILIAR";
}

export function isTuristaPlan(plan: MembershipPlan): boolean {
  return plan === "TURISTA";
}

export function isVecinoPlan(plan: MembershipPlan): boolean {
  return plan === "VECINO";
}

export function isBusinessPlan(plan: MembershipPlan): boolean {
  return (
    plan === "NEGOCIO_FAMILIAR" || plan === "MEDIANA_EMPRESA" || plan === "GRAN_EMPRESA"
  );
}

/** Membresía de pago activa (Vecino o plan de negocio). */
export function isPaidMember(plan: MembershipPlan, status: string): boolean {
  if (isTuristaPlan(plan)) return false;
  return status === "active" || status === "manual_active";
}

export function hasCommercialAccess(plan: MembershipPlan, status: string): boolean {
  if (plan === "TURISTA") return false;
  return status === "active" || status === "manual_active";
}

/** Pago por transferencia enviado, esperando revisión del administrador. */
export function isTransferPaymentPending(status: string): boolean {
  return status === "manual_pending";
}

/** Socio con plan de pago pero sin certificación activa (ni transferencia en revisión). */
export function needsCertificationPayment(plan: MembershipPlan, status: string): boolean {
  if (isTuristaPlan(plan)) return false;
  if (hasCommercialAccess(plan, status)) return false;
  if (isTransferPaymentPending(status)) return false;
  return true;
}

/** Puede entrar al panel: turista, pago activo o transferencia en revisión. */
export function canAccessPanel(plan: MembershipPlan, status: string): boolean {
  if (isTuristaPlan(plan)) return true;
  if (hasCommercialAccess(plan, status)) return true;
  if (isTransferPaymentPending(status)) return true;
  return false;
}

/** Vincular negocio del catálogo solo tras pago verificado (tarjeta o manual aprobado). */
export function canLinkSocioAccount(status: string): boolean {
  return status === "active" || status === "manual_active";
}

export function getUpgradePlans(current: MembershipPlan): PaidMembershipPlan[] {
  if (current === "TURISTA" || !PAID_PLANS.includes(current as PaidMembershipPlan)) {
    return [];
  }
  const idx = PAID_PLANS.indexOf(current as PaidMembershipPlan);
  if (idx < 0) return [];
  return PAID_PLANS.slice(idx + 1);
}

export function getPlanLabel(plan: MembershipPlan): string {
  return MEMBERSHIP_PLANS[plan]?.label ?? "Plan no iniciado";
}

export function getSubscriptionStatusLabel(status: string): string {
  if (status === "active" || status === "manual_active") return "Activa";
  if (status === "manual_pending") return "Pendiente de validación";
  if (status === "manual_rejected") return "Rechazada";
  return "Inactiva / pendiente";
}

export function isSubscriptionStatusPending(status: string): boolean {
  return status === "manual_pending";
}
