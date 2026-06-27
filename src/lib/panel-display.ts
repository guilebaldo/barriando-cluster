import type { MembershipPlan } from "@/generated/prisma/client";
import { formatPlanPriceMxn, type PaidMembershipPlan } from "@/lib/membresia";

const PAID_PLANS = new Set<MembershipPlan>([
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
export const RENEWAL_DISPLAY_FALLBACK = "Plan no iniciado";

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
