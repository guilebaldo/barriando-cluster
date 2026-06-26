import { prisma } from "@/lib/prisma";

/** Último instante del mes calendario (hora local del servidor). */
export function endOfCurrentMonth(from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Vence membresías manuales cuyo periodo ya terminó. */
export async function expireManualSubscriptionsIfNeeded(): Promise<number> {
  try {
    const now = new Date();
    const result = await prisma.subscription.updateMany({
      where: {
        status: "manual_active",
        currentPeriodEnd: { lt: now },
      },
      data: { status: "inactive" },
    });
    return result.count;
  } catch (error) {
    console.error("[subscription] expireManualSubscriptionsIfNeeded failed:", error);
    return 0;
  }
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
