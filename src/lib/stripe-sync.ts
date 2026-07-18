import type { MembershipPlan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { hasCommercialAccess } from "@/lib/membresia";
import { publishBusinessPresenceOnPayment } from "@/lib/publish-business";
import type Stripe from "stripe";

const PAID_PLANS = new Set<MembershipPlan>([
  "VECINO",
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
]);

function normalizeStripeStatus(status: string): string {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled" || status === "unpaid") return "inactive";
  return status;
}

function parsePlanFromMetadata(raw?: string | null): MembershipPlan | null {
  if (!raw) return null;
  const upper = raw.toUpperCase() as MembershipPlan;
  return PAID_PLANS.has(upper) ? upper : null;
}

/** Cancela una suscripción Stripe previa al cambiar de plan (evita doble cobro). */
async function cancelPreviousStripeSubscription(
  stripe: Stripe,
  previousId: string | null | undefined,
  nextId: string
): Promise<void> {
  if (!previousId || previousId === nextId) return;
  try {
    await stripe.subscriptions.cancel(previousId);
  } catch (error) {
    console.warn("[stripe] no se pudo cancelar suscripción anterior:", previousId, error);
  }
}

/**
 * Consulta Stripe y persiste el estado solo tras pago confirmado.
 * En upgrades (p. ej. Vecino → Negocio) prioriza el Checkout más reciente
 * para no quedarse con el plan de la suscripción anterior.
 */
export async function syncStripeSubscriptionForUser(userId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  const sub = user?.subscription;
  if (!sub) return false;

  try {
    if (sub.stripeCustomerId) {
      const { data: sessions } = await stripe.checkout.sessions.list({
        customer: sub.stripeCustomerId,
        limit: 12,
      });
      const completed = sessions
        .filter(
          (s) => s.status === "complete" && s.payment_status === "paid" && Boolean(s.subscription)
        )
        .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];

      if (completed?.subscription) {
        const plan = parsePlanFromMetadata(completed.metadata?.plan);
        if (plan) {
          const stripeSubId =
            typeof completed.subscription === "string"
              ? completed.subscription
              : completed.subscription.id;
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
          const periodEnd = (stripeSub as { current_period_end?: number }).current_period_end;
          const status = normalizeStripeStatus(stripeSub.status);

          await cancelPreviousStripeSubscription(stripe, sub.stripeSubscriptionId, stripeSub.id);

          await prisma.subscription.update({
            where: { userId },
            data: {
              plan,
              status,
              paymentMethod: "stripe",
              stripeSubscriptionId: stripeSub.id,
              stripeCustomerId: stripeSub.customer as string,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
          await publishBusinessPresenceOnPayment(userId, plan);
          return hasCommercialAccess(plan, status);
        }
      }
    }

    if (sub.stripeSubscriptionId) {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      const periodEnd = (stripeSub as { current_period_end?: number }).current_period_end;
      const status = normalizeStripeStatus(stripeSub.status);

      await prisma.subscription.update({
        where: { userId },
        data: {
          status,
          stripeCustomerId: stripeSub.customer as string,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
      });
      return hasCommercialAccess(sub.plan, status);
    }
  } catch (error) {
    console.error("[stripe] syncStripeSubscriptionForUser failed:", error);
  }

  return false;
}
