import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron-auth";
import { secureJson } from "@/lib/api";
import { sendRenewalReminders } from "@/lib/send-renewal-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETENTION_DAYS = 7;

/**
 * Cron diario ~8:00 America/Mexico_City (`0 14 * * *` UTC).
 * Limpia RateLimitBucket y avisa vencimientos de pago manual.
 * Auth: `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const cleanup = await prisma.rateLimitBucket.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  let reminders: Awaited<ReturnType<typeof sendRenewalReminders>> | { error: string };
  try {
    reminders = await sendRenewalReminders();
  } catch (error) {
    console.error("[cron] renewal reminders failed:", error);
    reminders = { error: error instanceof Error ? error.message : "renewal reminders failed" };
  }

  return secureJson({
    ok: true,
    deleted: cleanup.count,
    olderThanDays: RETENTION_DAYS,
    reminders,
  });
}
