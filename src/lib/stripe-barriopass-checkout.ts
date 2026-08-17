import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getStripe, formatStripeError } from "@/lib/stripe";
import type { StripeCheckoutResult } from "@/lib/stripe-checkout";
import { ensureBarrioPassEvent } from "@/lib/ensure-barriopass-event";
import {
  BARRIOPASS_FEE_MXN,
  BARRIOPASS_MAX_TICKETS_PER_USER,
  BARRIOPASS_SKUS,
  barrioPassQuote,
  type BarrioPassSku,
} from "@/lib/barriopass";

function integrationIdentifier(): string {
  return `barriopass_checkout_${randomBytes(4).toString("hex")}`;
}

export async function createBarrioPassCheckoutUrl(input: {
  userId: string;
  sku: BarrioPassSku;
  adultQty: number;
  childQty: number;
}): Promise<StripeCheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe no está configurado (falta STRIPE_SECRET_KEY)." };
  }

  const quote = barrioPassQuote(input);
  if (quote.tickets < 1) {
    return { ok: false, error: "Elige al menos un boleto." };
  }

  const product = BARRIOPASS_SKUS[input.sku];
  const event = await ensureBarrioPassEvent(input.sku);

  const already = await prisma.accessTicket.count({
    where: { userId: input.userId, eventId: event.id },
  });
  if (already + quote.tickets > BARRIOPASS_MAX_TICKETS_PER_USER) {
    return {
      ok: false,
      error: `Puedes tener hasta ${BARRIOPASS_MAX_TICKETS_PER_USER} BarrioPASS de este tipo.`,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
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
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          plan: user.subscription?.plan ?? "TURISTA",
          status: user.subscription?.status ?? "inactive",
          stripeCustomerId: customerId,
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const order = await prisma.ticketOrder.create({
      data: {
        userId: input.userId,
        eventId: event.id,
        status: "pending",
        amountCents: quote.total * 100,
      },
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const lineItems: {
      quantity: number;
      price_data: {
        currency: "mxn";
        unit_amount: number;
        product_data: { name: string; description: string };
      };
    }[] = [];

    if (input.adultQty > 0) {
      lineItems.push({
        quantity: input.adultQty,
        price_data: {
          currency: "mxn",
          unit_amount: product.adultMxn * 100,
          product_data: {
            name: `${product.name} · Adulto (13+)`,
            description: `${product.attractions} atracciones · Centro Histórico de Puebla`,
          },
        },
      });
    }
    if (input.childQty > 0) {
      lineItems.push({
        quantity: input.childQty,
        price_data: {
          currency: "mxn",
          unit_amount: product.childMxn * 100,
          product_data: {
            name: `${product.name} · Niño (6–12)`,
            description: `${product.attractions} atracciones · Centro Histórico de Puebla`,
          },
        },
      });
    }
    lineItems.push({
      quantity: quote.tickets,
      price_data: {
        currency: "mxn",
        unit_amount: BARRIOPASS_FEE_MXN * 100,
        product_data: {
          name: "Cuota de procesamiento",
          description: "Por boleto, no reembolsable.",
        },
      },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/pases/mios?pase=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/barriopass?pase=cancelado&sku=${input.sku}`,
      metadata: {
        userId: input.userId,
        eventId: event.id,
        orderId: order.id,
        billingKind: "access_ticket",
        productKind: "barriopass",
        sku: input.sku,
        ticketQty: String(quote.tickets),
      },
      payment_intent_data: {
        metadata: {
          userId: input.userId,
          eventId: event.id,
          orderId: order.id,
          billingKind: "access_ticket",
          productKind: "barriopass",
          sku: input.sku,
          ticketQty: String(quote.tickets),
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
    console.error("[stripe] createBarrioPassCheckoutUrl failed:", error);
    return { ok: false, error: formatStripeError(error) };
  }
}
