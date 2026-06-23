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

export function getPlanLabel(plan: MembershipPlan): string {
  return MEMBERSHIP_PLANS[plan].label;
}
