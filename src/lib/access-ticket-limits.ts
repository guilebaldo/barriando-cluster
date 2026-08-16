import { prisma } from "@/lib/prisma";

/** Máximo de boletos de acceso por usuario y evento. */
export const MAX_ACCESS_TICKETS_PER_EVENT = 2;

export async function countUserAccessTicketsForEvent(
  userId: string,
  eventId: string
): Promise<number> {
  return prisma.accessTicket.count({ where: { userId, eventId } });
}

export async function assertUserCanAcquireAccessTicket(
  userId: string,
  eventId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const forEvent = await prisma.accessTicket.count({ where: { userId, eventId } });
  if (forEvent >= MAX_ACCESS_TICKETS_PER_EVENT) {
    return {
      ok: false,
      error: `Solo puedes tener hasta ${MAX_ACCESS_TICKETS_PER_EVENT} pases por evento.`,
    };
  }
  return { ok: true };
}
