import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { MembershipPlan } from "@/generated/prisma/client";

const PAID_PLANS = new Set<MembershipPlan>([
  "VECINO",
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
]);

function parsePlan(raw?: string): MembershipPlan | null {
  if (!raw) return null;
  const upper = raw.toUpperCase() as MembershipPlan;
  return PAID_PLANS.has(upper) ? upper : null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return new Response("Stripe webhook not configured", { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { userId?: string; plan?: string };
      subscription?: string;
      payment_status?: string;
    };

    if (session.payment_status && session.payment_status !== "paid") {
      return new Response("ok", { status: 200 });
    }

    const userId = session.metadata?.userId;
    const plan = parsePlan(session.metadata?.plan);

    if (userId && session.subscription && plan) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const periodEnd = (sub as { current_period_end?: number }).current_period_end;
      const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status;

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
        update: {
          plan,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { id: string; status: string; current_period_end?: number };
    const status =
      sub.status === "active" || sub.status === "trialing"
        ? "active"
        : sub.status === "canceled"
          ? "inactive"
          : sub.status;

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      },
    });
  }

  return new Response("ok", { status: 200 });
}
