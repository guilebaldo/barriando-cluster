import type { MembershipPlan } from "@/generated/prisma/client";
import type { Socio } from "@/app/data/socios";

export type PaidMembershipPlan = Exclude<MembershipPlan, "VECINO">;

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
  VECINO: {
    id: "VECINO",
    label: "Vecino",
    tagline: "Comunidad Barriando",
    description:
      "Plan gratuito para recibir noticias, invitaciones a eventos y formar parte de la comunidad del Centro Histórico.",
    isPaid: false,
    benefits: [
      "Boletín y novedades del Clúster",
      "Invitaciones a eventos y festivales",
      "Acceso a la comunidad digital",
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
      "Aparecer en el mapa y directorio de socios",
      "Logo en el carrusel de la página principal",
      "Publicar entradas en el blog del Clúster",
      "Formar parte del MUAAP",
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
      "Mayor prioridad en el directorio",
      "Destacado en campañas del Clúster",
      "Acceso preferente a alianzas institucionales",
    ],
  },
  GRAN_EMPRESA: {
    id: "GRAN_EMPRESA",
    label: "Gran Empresa",
    tagline: "Hoteles y restaurantes grandes",
    description:
      "Diseñado para hoteles y restaurantes consolidados con más de 20 empleados que requieren máxima visibilidad.",
    isPaid: true,
    highlight: "Máxima visibilidad y beneficios exclusivos",
    benefits: [
      "Todo lo de los planes anteriores",
      "Posicionamiento premium en el carrusel",
      "Presencia destacada en rutas MUAAP",
      "Beneficios exclusivos para anfitriones del destino",
    ],
  },
};

export const PAID_PLANS: PaidMembershipPlan[] = [
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
];

/** Precios mensuales en MXN (mostrar en panel / planes). */
export const PLAN_PRICES_MXN: Record<PaidMembershipPlan, number> = {
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
  "Aparecer en el mapa y directorio de socios",
  "Mostrar tu logotipo en el carrusel de la página principal",
  "Redactar entradas en el blog del Clúster",
  "Formar parte del MUAAP (Museo Urbano Andante Abierto de Puebla)",
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

export function isVecinoPlan(plan: MembershipPlan): boolean {
  return plan === "VECINO";
}

export function hasCommercialAccess(plan: MembershipPlan, status: string): boolean {
  if (plan === "VECINO") return false;
  return status === "active" || status === "manual_active";
}

/** Permite entrar al panel sin rebotar al onboarding (p. ej. webhook pendiente). */
export function canAccessPanel(
  plan: MembershipPlan,
  status: string,
  opts?: { stripeSubscriptionId?: string | null; stripeCustomerId?: string | null }
): boolean {
  if (isVecinoPlan(plan)) return true;
  if (hasCommercialAccess(plan, status)) return true;
  if (status === "manual_pending") return true;
  if (opts?.stripeSubscriptionId || opts?.stripeCustomerId) return true;
  return false;
}

/** Vincular negocio del catálogo solo tras pago verificado (tarjeta o manual aprobado). */
export function canLinkSocioAccount(status: string): boolean {
  return status === "active" || status === "manual_active";
}

export function getUpgradePlans(current: MembershipPlan): PaidMembershipPlan[] {
  if (current === "VECINO" || !PAID_PLANS.includes(current as PaidMembershipPlan)) {
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
  if (status === "manual_pending") return "Pendiente de Validación";
  return "Inactiva / pendiente";
}

export function isSubscriptionStatusPending(status: string): boolean {
  return status === "manual_pending";
}
