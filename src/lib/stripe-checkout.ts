import { prisma } from "@/lib/prisma";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import type { PaidMembershipPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

export async function createStripeCheckoutUrl(
  userId: string,
  plan: PaidMembershipPlan
): Promise<string | null> {
  const stripe = getStripe();
  const priceId = getStripePriceId(plan);
  if (!stripe || !priceId) {
    console.warn("[stripe] checkout omitido:", { plan, hasClient: Boolean(stripe), hasPriceId: Boolean(priceId) });
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
    }

    const existingPlan: MembershipPlan = user.subscription?.plan ?? "TURISTA";
    const existingStatus = user.subscription?.status ?? "inactive";

    // No promover plan hasta webhook exitoso: solo persistir customer de Stripe.
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
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/panel?pago=exitoso&bienvenida=1`,
      cancel_url: `${appUrl}/certificacion/pago?pago=cancelado`,
      metadata: { userId, plan },
    });

    return session.url ?? null;
  } catch (error) {
    console.error("[stripe] createStripeCheckoutUrl failed:", error);
    return null;
  }
}
