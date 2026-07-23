import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { advanceBillingAnniversary } from "@/lib/subscription-lifecycle";
import { publishBusinessPresenceOnPayment } from "@/lib/publish-business";
import type { MembershipPlan } from "@/generated/prisma/client";
import type { StripeLocalPaymentMethod } from "@/lib/stripe-local-payment";

const PAID_PLANS = new Set<MembershipPlan>([
  "VECINO",
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
]);

export function parsePaidPlan(raw?: string | null): MembershipPlan | null {
  if (!raw) return null;
  const upper = raw.toUpperCase() as MembershipPlan;
  return PAID_PLANS.has(upper) ? upper : null;
}

/**
 * Activa un mes de membresía como pago manual (OXXO / SPEI / efectivo),
 * sin suscripción recurrente de Stripe. Respeta aniversario + gracia existente.
 */
export async function activateManualMonthFromLocalPayment(params: {
  userId: string;
  plan: MembershipPlan;
  paymentMethod: StripeLocalPaymentMethod | "transfer" | "cash";
  stripeCustomerId?: string | null;
}): Promise<boolean> {
  const { userId, plan, paymentMethod, stripeCustomerId } = params;

  const existing = await prisma.subscription.findUnique({ where: { userId } });
  const previousSubId = existing?.stripeSubscriptionId;
  if (previousSubId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await stripe.subscriptions.cancel(previousSubId);
      } catch (error) {
        console.warn(
          "[stripe] no se pudo cancelar suscripción al pasar a pago local:",
          previousSubId,
          error
        );
      }
    }
  }

  const nextEnd = advanceBillingAnniversary(existing?.currentPeriodEnd);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: "manual_active",
      paymentMethod,
      currentPeriodEnd: nextEnd,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: null,
    },
    update: {
      plan,
      status: "manual_active",
      paymentMethod,
      currentPeriodEnd: nextEnd,
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
      stripeSubscriptionId: null,
    },
  });

  await publishBusinessPresenceOnPayment(userId, plan, { reinstateRoster: true });
  return true;
}
