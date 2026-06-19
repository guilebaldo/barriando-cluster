import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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
    const session = event.data.object as { metadata?: { userId?: string }; subscription?: string };
    const userId = session.metadata?.userId;
    if (userId && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const periodEnd = (sub as { current_period_end?: number }).current_period_end;
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          status: sub.status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
        update: {
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { id: string; status: string; current_period_end?: number };
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status: sub.status,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      },
    });
  }

  return new Response("ok", { status: 200 });
}
