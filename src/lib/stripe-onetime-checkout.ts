import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PLAN_PRICES_MXN, getPlanLabel, type PaidMembershipPlan } from "@/lib/membresia";
import type { StripeLocalPaymentMethod } from "@/lib/stripe-local-payment";

export type { StripeLocalPaymentMethod };

/**
 * Checkout de un mes (no suscripción): OXXO.
 * Al confirmar Stripe → webhook activa membership como pago manual (cash-like).
 */
export async function createStripeLocalPaymentCheckoutUrl(
  userId: string,
  plan: PaidMembershipPlan,
  method: StripeLocalPaymentMethod = "oxxo"
): Promise<string | null> {
  const stripe = getStripe();
  const amountMxn = PLAN_PRICES_MXN[plan];
  if (!stripe || !amountMxn || method !== "oxxo") {
    console.warn("[stripe] local checkout omitido:", { plan, method, hasClient: Boolean(stripe) });
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) return null;

    let customerId = user.subscription?.stripeCustomerId;
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

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const planLabel = getPlanLabel(plan);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["oxxo"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: amountMxn * 100,
            product_data: {
              name: `Membresía ${planLabel} — 1 mes (OXXO)`,
              description:
                "Pago único de un mes. No es domiciliación automática; la vigencia se renueva al pagar de nuevo.",
            },
          },
        },
      ],
      success_url: `${appUrl}/panel?pago=local_pendiente&metodo=oxxo`,
      cancel_url: `${appUrl}/certificacion/pago?pago=cancelado`,
      metadata: {
        userId,
        plan,
        billingKind: "one_time_manual",
        paymentMethod: "oxxo",
      },
      payment_intent_data: {
        metadata: {
          userId,
          plan,
          billingKind: "one_time_manual",
          paymentMethod: "oxxo",
        },
      },
      locale: "es",
    });

    return session.url ?? null;
  } catch (error) {
    console.error("[stripe] createStripeLocalPaymentCheckoutUrl failed:", method, error);
    return null;
  }
}
