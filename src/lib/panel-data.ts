import type { MembershipPlan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP_PLANS, formatPlanPriceMxn, type PaidMembershipPlan } from "@/lib/membresia";

export type SafePanelSubscription = {
  plan: MembershipPlan;
  status: string;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
};

export type SafeSocioProfile = {
  businessName: string;
  website: string;
  googleBusinessUrl: string;
  logoUrl: string;
};

const PAID_PLANS = new Set<MembershipPlan>([
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
]);

export const DEFAULT_PANEL_SUBSCRIPTION: SafePanelSubscription = {
  plan: "VECINO",
  status: "inactive",
  currentPeriodEnd: null,
  stripeSubscriptionId: null,
  stripeCustomerId: null,
};

function isMembershipPlan(value: unknown): value is MembershipPlan {
  return typeof value === "string" && value in MEMBERSHIP_PLANS;
}

export function normalizePanelSubscription(
  sub?: {
    plan?: MembershipPlan | null;
    status?: string | null;
    currentPeriodEnd?: Date | string | null;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
  } | null
): SafePanelSubscription {
  if (!sub) return { ...DEFAULT_PANEL_SUBSCRIPTION };

  let currentPeriodEnd: string | null = null;
  if (sub.currentPeriodEnd) {
    const d =
      sub.currentPeriodEnd instanceof Date
        ? sub.currentPeriodEnd
        : new Date(sub.currentPeriodEnd);
    currentPeriodEnd = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return {
    plan: isMembershipPlan(sub.plan) ? sub.plan : "VECINO",
    status: typeof sub.status === "string" && sub.status.trim() ? sub.status : "inactive",
    currentPeriodEnd,
    stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
    stripeCustomerId: sub.stripeCustomerId ?? null,
  };
}

export function normalizeSocioProfile(
  profile?: {
    businessName?: string | null;
    website?: string | null;
    googleBusinessUrl?: string | null;
    logoUrl?: string | null;
  } | null
): SafeSocioProfile | null {
  if (!profile) return null;
  return {
    businessName: profile.businessName?.trim() ?? "",
    website: profile.website?.trim() ?? "",
    googleBusinessUrl: profile.googleBusinessUrl?.trim() ?? "",
    logoUrl: profile.logoUrl?.trim() ?? "",
  };
}

export function safePlanPriceLabel(plan: MembershipPlan): string {
  if (!PAID_PLANS.has(plan)) return "Plan comunitario gratuito";
  return formatPlanPriceMxn(plan as PaidMembershipPlan);
}

/** Carga usuario + suscripción; socioProfile es opcional si la tabla aún no existe en Neon. */
export async function loadPanelUser(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, socioProfile: true },
    });
  } catch (error) {
    console.error("[panel] load with socioProfile failed, retrying without:", error);
    return prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
  }
}

export async function loadTakenSocioIds(excludeUserId: string): Promise<number[]> {
  try {
    const rows = await prisma.user.findMany({
      where: { socioId: { not: null }, NOT: { id: excludeUserId } },
      select: { socioId: true },
    });
    return rows.map((r) => r.socioId).filter((id): id is number => typeof id === "number");
  } catch (error) {
    console.error("[panel] loadTakenSocioIds failed:", error);
    return [];
  }
}
