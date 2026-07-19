import { prisma } from "@/lib/prisma";

export {
  EXPIRY_DISPLAY_FALLBACK,
  RENEWAL_DISPLAY_FALLBACK,
  formatMembershipExpiry,
  formatRenewalDisplay,
  getRenewalMode,
  getRenewalModeLabel,
  type RenewalMode,
} from "@/lib/panel-display";

/** Suma 30 días desde la fecha indicada (aprobaciones manuales). */
export function addThirtyDaysFrom(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

/**
 * Renueva +30 días desde la fecha de vencimiento si aún no vence;
 * si ya venció (o no hay fecha), desde ahora.
 */
export function extendThirtyDaysFromExpiry(
  currentPeriodEnd: Date | string | null | undefined,
  now = new Date()
): Date {
  const end =
    currentPeriodEnd == null
      ? null
      : currentPeriodEnd instanceof Date
        ? currentPeriodEnd
        : new Date(currentPeriodEnd);
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;
  const base = validEnd && validEnd.getTime() > now.getTime() ? validEnd : now;
  return addThirtyDaysFrom(base);
}

/** Suma un mes calendario desde la fecha indicada. */
export function addOneMonthFrom(from = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/** @deprecated Usar addOneMonthFrom para aprobaciones manuales. */
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
