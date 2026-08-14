import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getStripe, formatStripeError } from "@/lib/stripe";
import type { StripeCheckoutResult } from "@/lib/stripe-checkout";

function integrationIdentifier(): string {
  return `pases_checkout_${randomBytes(4).toString("hex")}`;
}

export async function createAccessTicketCheckoutUrl(
  userId: string,
  eventId: string
): Promise<StripeCheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe no está configurado (falta STRIPE_SECRET_KEY)." };
  }

  const event = await prisma.accessEvent.findUnique({ where: { id: eventId } });
  if (!event || !event.published) {
    return { ok: false, error: "Ese pase no está disponible." };
  }
  if (event.priceCents <= 0) {
    return { ok: false, error: "Este pase no requiere pago." };
  }

  const close = event.endsAt ?? event.startsAt;
  if (close.getTime() < Date.now()) {
    return { ok: false, error: "Este evento ya terminó." };
  }

  const reserved = await prisma.ticketOrder.count({
    where: { eventId, status: { in: ["pending", "paid"] } },
  });
  if (event.capacity != null && reserved >= event.capacity) {
    return { ok: false, error: "Ya no hay cupo para este pase." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) return { ok: false, error: "Usuario no encontrado." };

    let customerId = user.subscription?.stripeCustomerId ?? null;
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.nombre || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: user.subscription?.plan ?? "TURISTA",
          status: user.subscription?.status ?? "inactive",
          stripeCustomerId: customerId,
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const order = await prisma.ticketOrder.create({
      data: {
        userId,
        eventId,
        status: "pending",
        amountCents: event.priceCents,
      },
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const when = event.startsAt.toLocaleString("es-MX", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: event.priceCents,
            product_data: {
              name: event.title,
              description: `${event.venue} · ${when}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/barrid?pase=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/barrid?pase=cancelado`,
      metadata: {
        userId,
        eventId,
        orderId: order.id,
        billingKind: "access_ticket",
      },
      payment_intent_data: {
        metadata: {
          userId,
          eventId,
          orderId: order.id,
          billingKind: "access_ticket",
        },
      },
      locale: "es",
      integration_identifier: integrationIdentifier(),
    });

    if (!session.url) {
      await prisma.ticketOrder.update({
        where: { id: order.id },
        data: { status: "cancelled" },
      });
      return { ok: false, error: "Stripe no devolvió URL de Checkout." };
    }

    await prisma.ticketOrder.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[stripe] createAccessTicketCheckoutUrl failed:", error);
    return { ok: false, error: formatStripeError(error) };
  }
}
