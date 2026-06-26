import type { MembershipPlan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { hasCommercialAccess, isVecinoPlan } from "@/lib/membresia";

const PAID_PLANS = new Set<MembershipPlan>([
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

/** Consulta Stripe y persiste el estado de suscripción antes de evaluar redirecciones. */
export async function syncStripeSubscriptionForUser(userId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  const sub = user?.subscription;
  if (!sub || isVecinoPlan(sub.plan)) return false;

  try {
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

    if (sub.stripeCustomerId) {
      const { data: sessions } = await stripe.checkout.sessions.list({
        customer: sub.stripeCustomerId,
        limit: 5,
      });
      const completed = sessions.find((s) => s.status === "complete" && s.subscription);
      if (completed?.subscription) {
        const stripeSub = await stripe.subscriptions.retrieve(completed.subscription as string);
        const periodEnd = (stripeSub as { current_period_end?: number }).current_period_end;
        const status = normalizeStripeStatus(stripeSub.status);
        const plan = parsePlanFromMetadata(completed.metadata?.plan) ?? sub.plan;

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan,
            status,
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: stripeSub.customer as string,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });
        return hasCommercialAccess(plan, status);
      }

      const { data: subscriptions } = await stripe.subscriptions.list({
        customer: sub.stripeCustomerId,
        status: "all",
        limit: 3,
      });
      const latest = subscriptions[0];
      if (latest) {
        const periodEnd = (latest as { current_period_end?: number }).current_period_end;
        const status = normalizeStripeStatus(latest.status);

        await prisma.subscription.update({
          where: { userId },
          data: {
            status,
            stripeSubscriptionId: latest.id,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });
        return hasCommercialAccess(sub.plan, status);
      }
    }
  } catch (error) {
    console.error("[stripe] syncStripeSubscriptionForUser failed:", error);
  }

  return false;
}
