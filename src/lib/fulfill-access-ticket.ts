import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function fulfillAccessTicketCheckout(session: Stripe.Checkout.Session) {
  if (session.metadata?.billingKind !== "access_ticket") return;
  if (session.payment_status && session.payment_status !== "paid") return;

  const orderId = session.metadata?.orderId;
  const userId = session.metadata?.userId;
  const eventId = session.metadata?.eventId;
  if (!orderId || !userId || !eventId) {
    console.warn("[stripe] access ticket: metadata incompleta", session.id, session.metadata);
    return;
  }

  const sessionId = session.id;

  await prisma.$transaction(async (tx) => {
    const order = await tx.ticketOrder.findUnique({
      where: { id: orderId },
      include: { tickets: { select: { id: true } } },
    });
    if (!order || order.userId !== userId || order.eventId !== eventId) {
      console.warn("[stripe] access ticket: orden no coincide", sessionId, orderId);
      return;
    }
    if (order.status === "paid" && order.tickets.length > 0) return;
    if (order.status === "cancelled") {
      console.warn("[stripe] access ticket: orden cancelada, no emitir", orderId);
      return;
    }

    const event = await tx.accessEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      console.warn("[stripe] access ticket: evento inexistente", eventId);
      return;
    }

    const sold = await tx.accessTicket.count({ where: { eventId } });
    if (event.capacity != null && sold >= event.capacity) {
      await tx.ticketOrder.update({
        where: { id: orderId },
        data: { status: "cancelled", stripeCheckoutSessionId: sessionId },
      });
      console.warn("[stripe] access ticket: cupo lleno al acreditar", orderId);
      return;
    }

    const ticketQty = Math.max(
      1,
      Math.min(10, Number.parseInt(session.metadata?.ticketQty ?? "1", 10) || 1)
    );
    const isBarrioPass = session.metadata?.productKind === "barriopass";
    const { MAX_ACCESS_TICKETS_PER_EVENT } = await import("@/lib/access-ticket-limits");
    const { BARRIOPASS_MAX_TICKETS_PER_USER } = await import("@/lib/barriopass");
    const maxTickets = isBarrioPass
      ? BARRIOPASS_MAX_TICKETS_PER_USER
      : MAX_ACCESS_TICKETS_PER_EVENT;
    const forEvent = await tx.accessTicket.count({ where: { userId, eventId } });
    if (order.tickets.length === 0 && forEvent + ticketQty > maxTickets) {
      await tx.ticketOrder.update({
        where: { id: orderId },
        data: { status: "cancelled", stripeCheckoutSessionId: sessionId },
      });
      console.warn("[stripe] access ticket: límite pases/evento", orderId, userId, eventId);
      return;
    }

    await tx.ticketOrder.update({
      where: { id: orderId },
      data: {
        status: "paid",
        stripeCheckoutSessionId: sessionId,
        amountCents: session.amount_total ?? order.amountCents,
      },
    });

    if (order.tickets.length === 0) {
      for (let i = 0; i < ticketQty; i += 1) {
        await tx.accessTicket.create({
          data: { orderId, userId, eventId },
        });
      }
    }
  });
}

export async function cancelAccessTicketCheckout(session: Stripe.Checkout.Session) {
  if (session.metadata?.billingKind !== "access_ticket") return;
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  await prisma.ticketOrder.updateMany({
    where: { id: orderId, status: "pending" },
    data: { status: "cancelled" },
  });
}

export async function fulfillAccessTicketByCheckoutSessionId(sessionId: string) {
  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  if (!stripe) return false;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.billingKind !== "access_ticket") return false;
  await fulfillAccessTicketCheckout(session);
  return true;
}
