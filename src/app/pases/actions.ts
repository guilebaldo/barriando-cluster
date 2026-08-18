"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { createAccessTicketCheckoutUrl } from "@/lib/stripe-ticket-checkout";
import {
  accessTicketTtlSeconds,
  buildAccessVerifyUrl,
  signAccessTicketToken,
  verifyAccessTicketToken,
} from "@/lib/access-ticket-credential";
import { isBarrioPassEventTitle } from "@/lib/barriopass";

export type PaseActionResult = { ok: true } | { ok: false; error: string };

export async function startAccessTicketCheckout(
  eventId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    const limited = await rateLimit({
      bucketKey: `pase-checkout:user:${session.id}`,
      limit: 8,
      windowSeconds: 60 * 10,
    });
    if (!limited.ok) {
      return { ok: false, error: "Demasiados intentos de compra. Espera un momento." };
    }

    const event = await prisma.accessEvent.findUnique({ where: { id: eventId } });
    if (!event || !event.published) {
      return { ok: false, error: "Ese pase no está disponible." };
    }

    const { assertUserCanAcquireAccessTicket } = await import("@/lib/access-ticket-limits");
    const canBuy = await assertUserCanAcquireAccessTicket(session.id, eventId);
    if (!canBuy.ok) return canBuy;

    if (event.priceCents <= 0) {
      const result = await claimCourtesyTicket(session.id, eventId);
      if (!result.ok) return result;
      return { ok: true, url: "/pases/mios?pase=ok" };
    }

    return createAccessTicketCheckoutUrl(session.id, eventId);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo iniciar el pago." };
  }
}

async function claimCourtesyTicket(
  userId: string,
  eventId: string
): Promise<PaseActionResult> {
  try {
    const { assertUserCanAcquireAccessTicket } = await import("@/lib/access-ticket-limits");
    const canBuy = await assertUserCanAcquireAccessTicket(userId, eventId);
    if (!canBuy.ok) return canBuy;

    await prisma.$transaction(async (tx) => {
      const event = await tx.accessEvent.findUnique({ where: { id: eventId } });
      if (!event || !event.published || event.priceCents > 0) {
        throw new Error("UNAVAILABLE");
      }
      const close = event.endsAt ?? event.startsAt;
      if (close.getTime() < Date.now()) {
        throw new Error("ENDED");
      }
      const { MAX_ACCESS_TICKETS_PER_EVENT } = await import("@/lib/access-ticket-limits");
      const forEvent = await tx.accessTicket.count({ where: { userId, eventId } });
      if (forEvent >= MAX_ACCESS_TICKETS_PER_EVENT) {
        throw new Error("EVENT_LIMIT");
      }
      const sold = await tx.accessTicket.count({ where: { eventId } });
      if (event.capacity != null && sold >= event.capacity) {
        throw new Error("SOLD_OUT");
      }
      const order = await tx.ticketOrder.create({
        data: {
          userId,
          eventId,
          status: "paid",
          amountCents: 0,
        },
      });
      await tx.accessTicket.create({
        data: { orderId: order.id, userId, eventId },
      });
    });
    revalidatePath("/pases");
    revalidatePath("/pases/mios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "SOLD_OUT") {
      return { ok: false, error: "Ya no hay cupo para este pase." };
    }
    if (error instanceof Error && error.message === "ENDED") {
      return { ok: false, error: "Este evento ya terminó." };
    }
    if (error instanceof Error && error.message === "EVENT_LIMIT") {
      return { ok: false, error: "Solo puedes tener hasta 2 pases por evento." };
    }
    return { ok: false, error: "No se pudo obtener el pase." };
  }
}

export type AccessTicketCredentialResult =
  | { ok: true; verifyUrl: string; expiresInSeconds: number }
  | { ok: false; error: string };

export async function createAccessTicketCredential(
  ticketId: string
): Promise<AccessTicketCredentialResult> {
  try {
    const session = await requireSession();
    const ticket = await prisma.accessTicket.findUnique({
      where: { id: ticketId },
      include: { event: { select: { startsAt: true, endsAt: true, title: true } } },
    });
    if (!ticket || ticket.userId !== session.id) {
      return { ok: false, error: "No encontramos ese pase." };
    }
    if (ticket.redeemedAt && !isBarrioPassEventTitle(ticket.event.title)) {
      return { ok: false, error: "Este pase ya fue usado." };
    }

    const expiresInSeconds = isBarrioPassEventTitle(ticket.event.title)
      ? 15 * 60
      : accessTicketTtlSeconds(ticket.event.endsAt, ticket.event.startsAt);
    const token = await signAccessTicketToken({
      userId: session.id,
      ticketId: ticket.id,
      code: ticket.code,
      expiresInSeconds,
    });
    return {
      ok: true,
      verifyUrl: buildAccessVerifyUrl(token),
      expiresInSeconds,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo generar el QR del pase." };
  }
}

export type AccessVerifyPayload =
  | {
      ok: true;
      data: {
        holderName: string;
        eventTitle: string;
        venue: string;
        startsAt: string;
        alreadyRedeemed: boolean;
      };
    }
  | { ok: false; error: string };

export async function loadAccessVerifyPayload(token: string): Promise<AccessVerifyPayload> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "Solo el personal del Clúster puede validar pases." };
    }
    const parsed = await verifyAccessTicketToken(token);
    if (!parsed) {
      return { ok: false, error: "El código del pase no es válido o ya caducó." };
    }
    const ticket = await prisma.accessTicket.findUnique({
      where: { id: parsed.ticketId },
      include: {
        user: { select: { nombre: true, email: true } },
        event: { select: { title: true, venue: true, startsAt: true } },
      },
    });
    if (!ticket || ticket.code !== parsed.code || ticket.userId !== parsed.userId) {
      return { ok: false, error: "El pase no coincide con el código." };
    }
    if (
      isBarrioPassEventTitle(ticket.event.title) &&
      Date.now() - ticket.createdAt.getTime() > 365 * 24 * 60 * 60 * 1000
    ) {
      return { ok: false, error: "Este BarrioPASS ya caducó." };
    }
    return {
      ok: true,
      data: {
        holderName: ticket.user.nombre?.trim() || ticket.user.email || "Visitante",
        eventTitle: ticket.event.title,
        venue: ticket.event.venue,
        startsAt: ticket.event.startsAt.toISOString(),
        alreadyRedeemed: Boolean(ticket.redeemedAt),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Inicia sesión para validar el pase." };
    }
    return { ok: false, error: "No se pudo leer el pase." };
  }
}

export async function confirmAccessTicketRedemption(
  token: string
): Promise<{ ok: true; holderName: string } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "Solo el personal del Clúster puede validar pases." };
    }
    const parsed = await verifyAccessTicketToken(token);
    if (!parsed) {
      return { ok: false, error: "El código del pase no es válido o ya caducó." };
    }

    const ticket = await prisma.accessTicket.findUnique({
      where: { id: parsed.ticketId },
      include: {
        user: { select: { nombre: true, email: true } },
        event: { select: { title: true } },
      },
    });
    if (!ticket || ticket.code !== parsed.code || ticket.userId !== parsed.userId) {
      return { ok: false, error: "El pase no coincide con el código." };
    }
    if (
      isBarrioPassEventTitle(ticket.event.title) &&
      Date.now() - ticket.createdAt.getTime() > 365 * 24 * 60 * 60 * 1000
    ) {
      return { ok: false, error: "Este BarrioPASS ya caducó." };
    }
    if (ticket.redeemedAt && !isBarrioPassEventTitle(ticket.event.title)) {
      return { ok: false, error: "Este pase ya fue usado." };
    }

    if (!isBarrioPassEventTitle(ticket.event.title)) {
      await prisma.accessTicket.update({
        where: { id: ticket.id },
        data: { redeemedAt: new Date() },
      });
    }

    return {
      ok: true,
      holderName: ticket.user.nombre?.trim() || ticket.user.email || "Visitante",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Inicia sesión para validar el pase." };
    }
    return { ok: false, error: "No se pudo confirmar el pase." };
  }
}

/** Elimina un pase propio (libera cupo del evento para esa cuenta). */
export async function deleteAccessTicket(
  ticketId: string
): Promise<PaseActionResult> {
  try {
    const session = await requireSession();
    const limited = await rateLimit({
      bucketKey: `pase-delete:user:${session.id}`,
      limit: 20,
      windowSeconds: 60 * 10,
    });
    if (!limited.ok) {
      return { ok: false, error: "Demasiados intentos. Espera un momento." };
    }

    const ticket = await prisma.accessTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, redeemedAt: true },
    });
    if (!ticket || ticket.userId !== session.id) {
      return { ok: false, error: "No encontramos ese pase." };
    }
    if (ticket.redeemedAt) {
      return { ok: false, error: "No puedes borrar un pase que ya fue usado." };
    }

    await prisma.accessTicket.delete({ where: { id: ticket.id } });
    revalidatePath("/pases");
    revalidatePath("/pases/mios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo borrar el pase." };
  }
}
