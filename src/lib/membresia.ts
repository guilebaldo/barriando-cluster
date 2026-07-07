import type { MembershipPlan } from "@/generated/prisma/client";
import type { Socio } from "@/app/data/socios";

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
    tagline: "Visitante del Centro Histórico",
    description:
      "Perfil gratuito para explorar Puebla, recibir novedades del Clúster y participar en el Pasaporte MAP.",
    isPaid: false,
    benefits: [
      "Boletín y novedades del Clúster",
      "Pasaporte digital MAP y sellos de temporada",
      "Acceso al itinerario peatonal MAP",
    ],
  },
  VECINO: {
    id: "VECINO",
    label: "Vecino",
    tagline: "Residente local certificado",
    description:
      "Suscripción mensual para residentes del Centro Histórico con beneficios exclusivos y reconocimiento comunitario.",
    isPaid: true,
    highlight: "Para quienes viven y transitan el barrio cada día",
    benefits: [
      "Insignia de vecino certificado en tu perfil",
      "Descuentos y convocatorias exclusivas para residentes",
      "Prioridad en eventos barriales del Clúster",
      "Acceso al Pasaporte MAP y rutas oficiales",
    ],
  },
  NEGOCIO_FAMILIAR: {
    id: "NEGOCIO_FAMILIAR",
    label: "Negocio Familiar",
    tagline: "Microempresa local",
    description: "Para pequeños negocios familiares que quieren dar sus primeros pasos comerciales en Barriando.",
    isPaid: true,
    highlight: "Ideal para cafés, tiendas y talleres de barrio",
    benefits: [
      "Presencia en el directorio oficial de socios (/socios)",
      "Publicar entradas en el blog del Clúster",
      "Perfil certificado en la guía Barriando",
    ],
  },
  MEDIANA_EMPRESA: {
    id: "MEDIANA_EMPRESA",
    label: "Mediana Empresa",
    tagline: "Mayor exposición",
    description: "Para negocios con mayor estructura que buscan visibilidad ampliada en la plataforma.",
    isPaid: true,
    highlight: "Museos, escuelas y servicios consolidados",
    benefits: [
      "Todo lo del plan Negocio Familiar",
      "Logo destacado en el carrusel de la página principal",
      "Mayor prioridad en el directorio de socios",
      "Destacado en campañas del Clúster",
    ],
  },
  GRAN_EMPRESA: {
    id: "GRAN_EMPRESA",
    label: "Gran Empresa",
    tagline: "Hoteles y restaurantes grandes",
    description:
      "Diseñado para hoteles y restaurantes consolidados con más de 20 empleados que requieren máxima visibilidad en el MAP.",
    isPaid: true,
    highlight: "Máxima visibilidad en el MAP y rutas oficiales",
    benefits: [
      "Presencia destacada en el mapa interactivo y rutas oficiales del MAP",
      "Vinculación con el Corredor de Oficios Vivos ($1,300 MDP en Barrios Fundacionales)",
      "Todo lo de los planes anteriores",
      "Posicionamiento premium en el carrusel y directorio",
      "Beneficios exclusivos para anfitriones del destino",
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
  "Presencia en el directorio oficial de socios (/socios)",
  "Logo destacado en el carrusel de la página principal (Mediana y Gran Empresa)",
  "Presencia destacada en el mapa interactivo y rutas oficiales del MAP (Gran Empresa)",
  "Redactar entradas en el blog del Clúster",
];

/** Asigna nivel de pago según categoría del catálogo estático de socios. */
export function getPlanForSocio(socio: Socio): PaidMembershipPlan {
  if (socio.categoria === "Hospedaje" || socio.categoria === "Hospital") {
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

/** @deprecated Usar isTuristaPlan */
export function isVecinoPlan(plan: MembershipPlan): boolean {
  return isTuristaPlan(plan);
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
