import { prisma } from "@/lib/prisma";
import { secureError, secureJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETENTION_DAYS = 7;

/**
 * Borra ventanas antiguas de RateLimitBucket.
 * Vercel Cron envía `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return secureError("CRON_SECRET no configurado.", 503);
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return secureError("No autorizado.", 401);
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.rateLimitBucket.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return secureJson({ ok: true, deleted: result.count, olderThanDays: RETENTION_DAYS });
}
