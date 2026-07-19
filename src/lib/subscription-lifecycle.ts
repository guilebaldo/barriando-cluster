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

/** Días de gracia tras el vencimiento antes de desactivar. */
export const MEMBERSHIP_GRACE_DAYS = 5;

/** Suma 30 días desde la fecha indicada (legacy / usos puntuales). */
export function addThirtyDaysFrom(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Avanza un mes calendario conservando el día de aniversario
 * (p. ej. día 9 → siempre día 9; 31 ene → último día de feb).
 */
export function addOneCalendarMonthKeepingDay(from: Date): Date {
  const source = new Date(from);
  const day = source.getDate();
  const result = new Date(source);
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  result.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
  return result;
}

/** Suma un mes calendario desde la fecha indicada. */
export function addOneMonthFrom(from = new Date()): Date {
  return addOneCalendarMonthKeepingDay(from);
}

/**
 * Al validar/renovar: avanza el aniversario mensual hasta que quede en el futuro.
 * Si no hay fecha, el primer corte es dentro de un mes (mismo día).
 */
export function advanceBillingAnniversary(
  currentPeriodEnd: Date | string | null | undefined,
  now = new Date()
): Date {
  if (currentPeriodEnd == null) {
    return addOneCalendarMonthKeepingDay(now);
  }
  const parsed =
    currentPeriodEnd instanceof Date ? currentPeriodEnd : new Date(currentPeriodEnd);
  if (Number.isNaN(parsed.getTime())) {
    return addOneCalendarMonthKeepingDay(now);
  }

  let cursor = new Date(parsed);
  let guard = 0;
  while (cursor.getTime() <= now.getTime() && guard < 120) {
    cursor = addOneCalendarMonthKeepingDay(cursor);
    guard += 1;
  }
  return cursor;
}

/** @deprecated Usar advanceBillingAnniversary (día fijo mensual). */
export function extendThirtyDaysFromExpiry(
  currentPeriodEnd: Date | string | null | undefined,
  now = new Date()
): Date {
  return advanceBillingAnniversary(currentPeriodEnd, now);
}

/** Fin de gracia = vencimiento + MEMBERSHIP_GRACE_DAYS. */
export function graceEndsAt(periodEnd: Date): Date {
  return addDays(periodEnd, MEMBERSHIP_GRACE_DAYS);
}

/** ¿Ya debe desactivarse? (pasó vencimiento + gracia). */
export function shouldDeactivateAfterGrace(
  periodEnd: Date | string | null | undefined,
  now = new Date()
): boolean {
  if (periodEnd == null) return false;
  const end = periodEnd instanceof Date ? periodEnd : new Date(periodEnd);
  if (Number.isNaN(end.getTime())) return false;
  return now.getTime() > graceEndsAt(end).getTime();
}

/**
 * Meses de atraso contados por aniversarios cuya gracia ya pasó.
 * 0 si aún está vigente o en gracia.
 */
export function computeMonthsPastDue(
  periodEnd: Date | string | null | undefined,
  now = new Date()
): number {
  if (periodEnd == null) return 0;
  const end = periodEnd instanceof Date ? periodEnd : new Date(periodEnd);
  if (Number.isNaN(end.getTime())) return 0;
  if (now.getTime() <= graceEndsAt(end).getTime()) return 0;

  let months = 0;
  let cursor = new Date(end);
  let guard = 0;
  while (now.getTime() > graceEndsAt(cursor).getTime() && guard < 120) {
    months += 1;
    cursor = addOneCalendarMonthKeepingDay(cursor);
    guard += 1;
  }
  return months;
}

/** @deprecated Usar addOneMonthFrom para aprobaciones manuales. */
export function endOfCurrentMonth(from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Desactiva membresías manuales y roster activos cuya gracia ya venció.
 * Actualiza monthsPastDue en el roster.
 */
export async function expireMembershipsAfterGraceIfNeeded(): Promise<{
  subscriptions: number;
  roster: number;
}> {
  const now = new Date();
  let subscriptions = 0;
  let roster = 0;

  try {
    const manualSubs = await prisma.subscription.findMany({
      where: {
        status: "manual_active",
        currentPeriodEnd: { not: null },
      },
      select: { userId: true, currentPeriodEnd: true },
    });

    for (const sub of manualSubs) {
      if (!shouldDeactivateAfterGrace(sub.currentPeriodEnd, now)) continue;
      await prisma.subscription.update({
        where: { userId: sub.userId },
        data: { status: "inactive" },
      });
      subscriptions += 1;
    }
  } catch (error) {
    console.error("[subscription] expire manual after grace failed:", error);
  }

  try {
    const rows = await prisma.catalogMembership.findMany({
      where: {
        currentPeriodEnd: { not: null },
      },
      select: { socioId: true, currentPeriodEnd: true, status: true, monthsPastDue: true },
    });

    for (const row of rows) {
      const monthsPastDue = computeMonthsPastDue(row.currentPeriodEnd, now);
      const deactivate = shouldDeactivateAfterGrace(row.currentPeriodEnd, now);

      if (row.status === "active" && deactivate) {
        await prisma.catalogMembership.update({
          where: { socioId: row.socioId },
          data: { status: "inactive", monthsPastDue },
        });
        roster += 1;
        continue;
      }

      if (row.monthsPastDue !== monthsPastDue) {
        await prisma.catalogMembership.update({
          where: { socioId: row.socioId },
          data: { monthsPastDue },
        });
      }
    }
  } catch (error) {
    console.error("[subscription] expire roster after grace failed:", error);
  }

  return { subscriptions, roster };
}

/** @deprecated Usar expireMembershipsAfterGraceIfNeeded. */
export async function expireManualSubscriptionsIfNeeded(): Promise<number> {
  const result = await expireMembershipsAfterGraceIfNeeded();
  return result.subscriptions;
}
