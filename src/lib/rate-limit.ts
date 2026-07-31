import { prisma } from "@/lib/prisma";

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

function windowStartFor(nowMs: number, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(nowMs / windowMs) * windowMs);
}

/**
 * Rate limit por bucket (IP, userId, email…) usando Postgres.
 * Funciona en serverless sin Redis adicional.
 */
export async function rateLimit(input: {
  bucketKey: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { bucketKey, limit, windowSeconds } = input;
  const windowStart = windowStartFor(Date.now(), windowSeconds);

  const row = await prisma.rateLimitBucket.upsert({
    where: {
      bucketKey_windowStart: { bucketKey, windowStart },
    },
    create: { bucketKey, windowStart, hits: 1 },
    update: { hits: { increment: 1 } },
    select: { hits: true },
  });

  if (row.hits > limit) {
    const elapsed = Date.now() - windowStart.getTime();
    const retryAfterSeconds = Math.max(1, Math.ceil((windowSeconds * 1000 - elapsed) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  return { ok: true, remaining: Math.max(0, limit - row.hits) };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
