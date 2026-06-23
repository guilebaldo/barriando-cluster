import { NextRequest } from "next/server";
import { z } from "zod";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { requireSession, getUserWithSubscription } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { secureError, secureJson } from "@/lib/api";

const bodySchema = z.object({
  plan: z.enum(["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"]).optional(),
});

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return secureError("Stripe no está configurado. Contacta al administrador.", 503);
  }

  try {
    const session = await requireSession();
    const stripe = getStripe();
    if (!stripe) return secureError("Stripe no disponible", 503);

    const rawBody = await request.json().catch(() => ({}));
    const { plan } = bodySchema.parse(rawBody);

    const user = await getUserWithSubscription(session.id);
    if (!user) return secureError("Usuario no encontrado", 404);

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.nombre || undefined,
        metadata: {
          userId: user.id,
          socioId: user.socioId != null ? String(user.socioId) : "",
        },
      });

      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
          plan: plan ?? user.subscription?.plan ?? "NEGOCIO_FAMILIAR",
        },
        update: {
          stripeCustomerId: customerId,
          ...(plan ? { plan } : {}),
        },
      });
    } else if (plan) {
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { plan },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const selectedPlan = plan ?? user.subscription?.plan ?? "NEGOCIO_FAMILIAR";

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/panel?pago=exitoso&bienvenida=1`,
      cancel_url: `${appUrl}/panel?pago=cancelado`,
      metadata: { userId: user.id, plan: selectedPlan },
    });

    return secureJson({ url: checkout.url });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return secureError("Debes iniciar sesión", 401);
    }
    console.error("Stripe checkout error:", error);
    return secureError("No se pudo iniciar el pago", 500);
  }
}
