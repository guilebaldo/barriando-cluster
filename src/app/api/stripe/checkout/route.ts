import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { requireSession, getUserWithSubscription } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { secureError, secureJson } from "@/lib/api";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return secureError("Stripe no está configurado. Contacta al administrador.", 503);
  }

  try {
    const session = await requireSession();
    const stripe = getStripe();
    if (!stripe) return secureError("Stripe no disponible", 503);

    const user = await getUserWithSubscription(session.id);
    if (!user) return secureError("Usuario no encontrado", 404);

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.nombre || undefined,
        metadata: { 
          userId: user.id, 
          socioId: user.socioId ? String(user.socioId) : undefined 
        },
      });

      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { 
          userId: user.id, 
          stripeCustomerId: customerId 
        },
        update: { 
          stripeCustomerId: customerId 
        },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/panel?pago=exitoso`,
      cancel_url: `${appUrl}/panel?pago=cancelado`,
      metadata: { userId: user.id },
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
