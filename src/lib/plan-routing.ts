import type { MembershipPlan } from "@/generated/prisma/client";
import { isVecinoPlan } from "@/lib/membresia";

export const PENDING_PLAN_COOKIE = "barriando_pending_plan";
export const ONBOARDING_CONTINUE_PATH = "/api/onboarding/continue";

/** Slugs usados en `/registro?plan=...` */
export const PLAN_SLUGS = {
  vecino: "VECINO",
  negocio_familiar: "NEGOCIO_FAMILIAR",
  mediana_empresa: "MEDIANA_EMPRESA",
  gran_empresa: "GRAN_EMPRESA",
} as const satisfies Record<string, MembershipPlan>;

export type PlanSlug = keyof typeof PLAN_SLUGS;

const SLUG_BY_PLAN: Record<MembershipPlan, PlanSlug> = {
  VECINO: "vecino",
  NEGOCIO_FAMILIAR: "negocio_familiar",
  MEDIANA_EMPRESA: "mediana_empresa",
  GRAN_EMPRESA: "gran_empresa",
};

export function planToSlug(plan: MembershipPlan): PlanSlug {
  return SLUG_BY_PLAN[plan];
}

export function registroUrl(plan: MembershipPlan): string {
  return `/registro?plan=${planToSlug(plan)}`;
}

export function parsePlanSlug(raw?: string | null): MembershipPlan | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/-/g, "_");
  if (key in PLAN_SLUGS) {
    return PLAN_SLUGS[key as PlanSlug];
  }
  const upper = raw.trim().toUpperCase();
  const plans: MembershipPlan[] = ["VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];
  if (plans.includes(upper as MembershipPlan)) {
    return upper as MembershipPlan;
  }
  return null;
}

export function isPaidMembershipPlan(plan: MembershipPlan): boolean {
  return !isVecinoPlan(plan);
}
