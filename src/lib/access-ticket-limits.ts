import { prisma } from "@/lib/prisma";

/** Máximo de boletos de acceso por cuenta de usuario. */
export const MAX_ACCESS_TICKETS_PER_USER = 2;

export async function countUserAccessTickets(userId: string): Promise<number> {
  return prisma.accessTicket.count({ where: { userId } });
}

export async function assertUserCanAcquireAccessTicket(
  userId: string,
  eventId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [owned, forEvent] = await Promise.all([
    prisma.accessTicket.count({ where: { userId } }),
    prisma.accessTicket.count({ where: { userId, eventId } }),
  ]);
  if (forEvent > 0) {
    return { ok: false, error: "Ya tienes un pase para este evento." };
  }
  if (owned >= MAX_ACCESS_TICKETS_PER_USER) {
    return {
      ok: false,
      error: `Solo puedes tener hasta ${MAX_ACCESS_TICKETS_PER_USER} pases por cuenta.`,
    };
  }
  return { ok: true };
}
