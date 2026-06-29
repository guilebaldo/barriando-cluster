import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createStripeCheckoutUrl } from "@/lib/stripe-checkout";
import { syncStripeSubscriptionForUser } from "@/lib/stripe-sync";
import { isStripeConfiguredForPlan } from "@/lib/stripe";
import {
  isPaidMembershipPlan,
  ONBOARDING_CONTINUE_PATH,
  parsePlanSlug,
} from "@/lib/plan-routing";
import { PENDING_PLAN_COOKIE } from "@/lib/pending-plan-cookie";
import type { MembershipPlan } from "@/generated/prisma/client";
import {
  canAccessPanel,
  hasCommercialAccess,
  isTuristaPlan,
  type PaidMembershipPlan,
} from "@/lib/membresia";

export async function readPendingPlanCookie(): Promise<MembershipPlan | null> {
  const jar = await cookies();
  return parsePlanSlug(jar.get(PENDING_PLAN_COOKIE)?.value);
}

export async function clearPendingPlanCookie() {
  const jar = await cookies();
  jar.delete(PENDING_PLAN_COOKIE);
}

async function ensureTuristaSubscription(userId: string) {
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: "TURISTA", status: "inactive" },
    update: {},
  });
}

async function loadSubscription(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  return dbUser?.subscription ?? null;
}

async function createStripeCheckoutRedirect(userId: string, plan: PaidMembershipPlan) {
  const url = await createStripeCheckoutUrl(userId, plan);
  if (!url) redirect("/panel?pago=stripe_no_configurado");
  redirect(url);
}

/** Tras autenticación: bifurca Vecino → panel o plan de pago → Stripe Checkout. */
export async function continueOnboardingAfterAuth(explicitPlan?: MembershipPlan | null) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pending = explicitPlan ?? (await readPendingPlanCookie());
  await clearPendingPlanCookie();

  await syncStripeSubscriptionForUser(session.user.id);
  let sub = await loadSubscription(session.user.id);

  if (sub && hasCommercialAccess(sub.plan, sub.status)) {
    redirect("/panel?pago=exitoso");
  }

  if (pending && isPaidMembershipPlan(pending)) {
    if (!isStripeConfiguredForPlan(pending)) {
      redirect("/panel?pago=stripe_no_configurado");
    }
    if (sub?.stripeSubscriptionId || sub?.stripeCustomerId) {
      redirect("/panel?pago=procesando");
    }
    await createStripeCheckoutRedirect(session.user.id, pending as PaidMembershipPlan);
  }

  if (!sub || isTuristaPlan(sub.plan)) {
    await ensureTuristaSubscription(session.user.id);
    redirect("/panel?bienvenida=1");
  }

  if (
    canAccessPanel(sub.plan, sub.status, {
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
    })
  ) {
    redirect("/panel?pago=procesando");
  }

  if (isPaidMembershipPlan(sub.plan) && isStripeConfiguredForPlan(sub.plan)) {
    await createStripeCheckoutRedirect(session.user.id, sub.plan as PaidMembershipPlan);
  }

  redirect("/planes?pago=requiere_plan");
}

export { ONBOARDING_CONTINUE_PATH };
