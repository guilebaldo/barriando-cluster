import type { MembershipPlan } from "@/generated/prisma/client";
import { formatPlanPriceMxn, type PaidMembershipPlan } from "@/lib/membresia";

const PAID_PLANS = new Set<MembershipPlan>([
  "VECINO",
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
]);

/** Etiqueta de precio segura para UI del panel (sin acceso a base de datos). */
export function safePlanPriceLabel(plan: MembershipPlan): string {
  if (!PAID_PLANS.has(plan)) return "Plan comunitario gratuito";
  return formatPlanPriceMxn(plan as PaidMembershipPlan);
}

export type RenewalMode = "automatic" | "manual" | null;

export function getRenewalMode(
  status: string,
  stripeSubscriptionId?: string | null
): RenewalMode {
  if (status === "active" && stripeSubscriptionId) return "automatic";
  if (status === "manual_active") return "manual";
  return null;
}

export function getRenewalModeLabel(mode: RenewalMode): string | null {
  if (mode === "automatic") return "Renovación Automática";
  if (mode === "manual") return "Renovación Manual";
  return null;
}

export const EXPIRY_DISPLAY_FALLBACK = "Sin fecha de vencimiento";
export const EXPIRY_PENDING_APPROVAL = "Pendiente de validación";
export const RENEWAL_DISPLAY_FALLBACK = "Plan no iniciado";

export function addMonthsFromDate(base: Date | string, months: number): Date {
  const d = typeof base === "string" ? new Date(base) : new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function resolveMembershipExpiryLabel(input: {
  status: string;
  currentPeriodEnd?: string | null;
  subscriptionCreatedAt?: string | null;
  stripeSubscriptionId?: string | null;
}): string {
  const { status, currentPeriodEnd, subscriptionCreatedAt, stripeSubscriptionId } = input;

  if (status === "manual_pending") {
    return EXPIRY_PENDING_APPROVAL;
  }

  if (status === "manual_rejected") {
    return EXPIRY_DISPLAY_FALLBACK;
  }

  if (currentPeriodEnd) {
    return formatMembershipExpiry(currentPeriodEnd);
  }

  const isActiveStripe = status === "active" && Boolean(stripeSubscriptionId);
  const isActiveManual = status === "manual_active";

  if ((isActiveStripe || isActiveManual) && subscriptionCreatedAt) {
    const estimated = addMonthsFromDate(subscriptionCreatedAt, 1);
    return formatMembershipExpiry(estimated);
  }

  return EXPIRY_DISPLAY_FALLBACK;
}

export function formatMembershipExpiry(date: Date | string | null | undefined): string {
  if (!date) return EXPIRY_DISPLAY_FALLBACK;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return EXPIRY_DISPLAY_FALLBACK;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRenewalDisplay(
  status?: string | null,
  stripeSubscriptionId?: string | null
): string {
  const mode = getRenewalMode(status ?? "", stripeSubscriptionId);
  return getRenewalModeLabel(mode) ?? RENEWAL_DISPLAY_FALLBACK;
}

export function formatNextChargeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
