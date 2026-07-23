import { prisma } from "@/lib/prisma";
import { getStripe, getStripePriceId, formatStripeError } from "@/lib/stripe";
import type { PaidMembershipPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

export type StripeCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createStripeCheckoutUrl(
  userId: string,
  plan: PaidMembershipPlan
): Promise<StripeCheckoutResult> {
  const stripe = getStripe();
  const priceId = getStripePriceId(plan);
  if (!stripe) {
    return { ok: false, error: "Stripe no está configurado (falta STRIPE_SECRET_KEY)." };
  }
  if (!priceId) {
    return {
      ok: false,
      error: `Falta el Price ID Live para el plan ${plan} (STRIPE_PRICE_ID_${plan} en Vercel).`,
    };
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
        // Customer de otro modo (test/live) o borrado → crear de nuevo.
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
    }

    const existingPlan: MembershipPlan = user.subscription?.plan ?? "TURISTA";
    const existingStatus = user.subscription?.status ?? "inactive";

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: existingPlan,
        status: existingStatus,
        stripeCustomerId: customerId,
      },
      update: {
        stripeCustomerId: customerId,
      },
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const successPath = "/barrid?pago=exitoso&bienvenida=1";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}/certificacion/pago?pago=cancelado`,
      metadata: { userId, plan },
    });

    if (!session.url) {
      return { ok: false, error: "Stripe no devolvió URL de Checkout." };
    }
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[stripe] createStripeCheckoutUrl failed:", error);
    return { ok: false, error: formatStripeError(error) };
  }
}
