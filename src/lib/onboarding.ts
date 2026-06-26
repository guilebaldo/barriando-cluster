import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createStripeCheckoutUrl } from "@/lib/stripe-checkout";
import { isStripeConfiguredForPlan } from "@/lib/stripe";
import {
  isPaidMembershipPlan,
  ONBOARDING_CONTINUE_PATH,
  parsePlanSlug,
} from "@/lib/plan-routing";
import { PENDING_PLAN_COOKIE } from "@/lib/pending-plan-cookie";
import type { MembershipPlan } from "@/generated/prisma/client";
import { hasCommercialAccess, isVecinoPlan, type PaidMembershipPlan } from "@/lib/membresia";

export async function readPendingPlanCookie(): Promise<MembershipPlan | null> {
  const jar = await cookies();
  return parsePlanSlug(jar.get(PENDING_PLAN_COOKIE)?.value);
}

export async function clearPendingPlanCookie() {
  const jar = await cookies();
  jar.delete(PENDING_PLAN_COOKIE);
}

async function ensureVecinoSubscription(userId: string) {
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: "VECINO", status: "inactive" },
    update: { plan: "VECINO" },
  });
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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  const sub = dbUser?.subscription;

  if (sub && hasCommercialAccess(sub.plan, sub.status)) {
    redirect("/panel");
  }

  if (!pending || pending === "VECINO") {
    if (!sub || isVecinoPlan(sub.plan)) {
      await ensureVecinoSubscription(session.user.id);
    }
    redirect("/panel?bienvenida=1");
  }

  if (isPaidMembershipPlan(pending)) {
    if (!isStripeConfiguredForPlan(pending)) {
      redirect("/panel?pago=stripe_no_configurado");
    }
    await createStripeCheckoutRedirect(session.user.id, pending);
  }

  redirect("/panel");
}

export { ONBOARDING_CONTINUE_PATH };
