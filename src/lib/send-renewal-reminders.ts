import { prisma } from "@/lib/prisma";
import { notifyRenewalReminder } from "@/lib/notify-renewal-reminder";
import { addMonthsFromDate } from "@/lib/panel-display";

const MEXICO_TZ = "America/Mexico_City";
const DAYS_BEFORE = 5;

function ymdInMexico(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function sameInstant(a: Date | null | undefined, b: Date): boolean {
  return Boolean(a && a.getTime() === b.getTime());
}

/**
 * Aviso 5 días antes del vencimiento, solo membresías de pago mensual manual
 * (`manual_active`, sin domiciliación Stripe).
 */
export async function sendRenewalReminders(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const targetYmd = addDaysYmd(ymdInMexico(new Date()), DAYS_BEFORE);

  const rows = await prisma.subscription.findMany({
    where: {
      status: "manual_active",
      stripeSubscriptionId: null,
      plan: { not: "TURISTA" },
      user: { email: { not: null } },
    },
    select: {
      id: true,
      plan: true,
      currentPeriodEnd: true,
      createdAt: true,
      renewalReminderPeriodEnd: true,
      user: { select: { email: true, nombre: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const periodEnd = row.currentPeriodEnd ?? addMonthsFromDate(row.createdAt, 1);
    if (ymdInMexico(periodEnd) !== targetYmd) {
      skipped += 1;
      continue;
    }
    if (sameInstant(row.renewalReminderPeriodEnd, periodEnd)) {
      skipped += 1;
      continue;
    }

    const to = row.user.email?.trim();
    if (!to) {
      skipped += 1;
      continue;
    }

    const result = await notifyRenewalReminder({
      to,
      nombre: row.user.nombre,
      plan: row.plan,
      periodEnd,
    });

    if (!result.ok) {
      failed += 1;
      console.error("[cron] renewal reminder failed:", { id: row.id, error: result.error });
      continue;
    }

    await prisma.subscription.update({
      where: { id: row.id },
      data: { renewalReminderPeriodEnd: periodEnd },
    });
    sent += 1;
  }

  return { scanned: rows.length, sent, skipped, failed };
}
