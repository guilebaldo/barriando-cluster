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
