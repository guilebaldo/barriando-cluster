import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { publishBusinessPresenceOnPayment } from "@/lib/publish-business";
import {
  activateManualMonthFromLocalPayment,
  parsePaidPlan,
} from "@/lib/activate-manual-month";
import { isStripeLocalPaymentMethod } from "@/lib/stripe-local-payment";
import { notifyPaymentCredited } from "@/lib/notify-payment-credited";
import type { MembershipPlan } from "@/generated/prisma/client";
import type Stripe from "stripe";

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

async function fulfillSubscriptionCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status && session.payment_status !== "paid") {
    return;
  }

  const userId = session.metadata?.userId;
  const plan = parsePlan(session.metadata?.plan);

  if (!userId || !session.subscription || !plan) return;

  const stripe = getStripe();
  if (!stripe) return;

  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  const periodEnd = (sub as { current_period_end?: number }).current_period_end;
  const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status;

  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeSubscriptionId: true, status: true },
  });
  const previousSubId = existing?.stripeSubscriptionId;
  const alreadyActiveOnThisSub =
    previousSubId === sub.id && (existing?.status === "active" || existing?.status === "trialing");

  if (previousSubId && previousSubId !== sub.id) {
    try {
      await stripe.subscriptions.cancel(previousSubId);
    } catch (error) {
      console.warn("[stripe] webhook: no se pudo cancelar suscripción anterior:", previousSubId, error);
    }
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer as string,
      status,
      paymentMethod: "stripe",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
    update: {
      plan,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer as string,
      status,
      paymentMethod: "stripe",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  await publishBusinessPresenceOnPayment(userId, plan, { reinstateRoster: true });

  if (!alreadyActiveOnThisSub && status === "active") {
    await sendPaymentCreditedSafe({
      userId,
      plan,
      paymentMethod: "stripe",
      amountCents: session.amount_total,
      periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    });
  }
}

async function fulfillOneTimeManualCheckout(
  session: Stripe.Checkout.Session,
  options: { sendReceipt: boolean }
) {
  if (session.payment_status !== "paid") return;

  const userId = session.metadata?.userId;
  const plan = parsePaidPlan(session.metadata?.plan);
  const methodRaw = session.metadata?.paymentMethod;
  if (!userId || !plan || !isStripeLocalPaymentMethod(methodRaw)) {
    console.warn("[stripe] one-time manual: metadata incompleta", session.id, session.metadata);
    return;
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  await activateManualMonthFromLocalPayment({
    userId,
    plan,
    paymentMethod: methodRaw,
    stripeCustomerId: customerId,
  });

  if (!options.sendReceipt) return;

  const after = await prisma.subscription.findUnique({
    where: { userId },
    select: { currentPeriodEnd: true },
  });

  await sendPaymentCreditedSafe({
    userId,
    plan,
    paymentMethod: methodRaw,
    amountCents: session.amount_total,
    periodEnd: after?.currentPeriodEnd ?? null,
  });
}

async function sendPaymentCreditedSafe(params: {
  userId: string;
  plan: MembershipPlan;
  paymentMethod: string;
  amountCents?: number | null;
  periodEnd?: Date | null;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, nombre: true },
    });
    if (!user?.email) {
      console.warn("[stripe] payment email skipped: user sin email", params.userId);
      return;
    }
    await notifyPaymentCredited({
      to: user.email,
      nombre: user.nombre,
      plan: params.plan,
      paymentMethod: params.paymentMethod,
      amountCents: params.amountCents,
      periodEnd: params.periodEnd,
    });
  } catch (error) {
    // No tumbar el webhook si Resend falla: el pago ya quedó acreditado.
    console.error("[stripe] payment credited email failed:", error);
  }
}

function isOneTimeManualSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.billingKind === "one_time_manual" || session.mode === "payment";
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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (isOneTimeManualSession(session) && session.metadata?.billingKind === "one_time_manual") {
        // OXXO: completed suele llegar unpaid; si ya viene paid, activa sin correo
        // (el recibo se manda en async_payment_succeeded).
        await fulfillOneTimeManualCheckout(session, { sendReceipt: false });
      } else if (session.mode === "subscription") {
        await fulfillSubscriptionCheckout(session);
      }
    }

    if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.billingKind === "one_time_manual") {
        await fulfillOneTimeManualCheckout(session, { sendReceipt: true });
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

      if (status === "active") {
        const row = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
          select: { userId: true, plan: true },
        });
        if (row) await publishBusinessPresenceOnPayment(row.userId, row.plan);
      }
    }
  } catch (error) {
    console.error("[stripe] webhook handler error:", event.type, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
