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
  hasCommercialAccess,
  isTuristaPlan,
  type PaidMembershipPlan,
} from "@/lib/membresia";
import { isAdminUser } from "@/lib/admin";
import {
  resolvePostAuthHomePath,
  resolvePostAuthHomePathAfterPayment,
} from "@/lib/post-auth-home";

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
    update: { plan: "TURISTA", status: "inactive" },
  });
}

async function ensurePendingPaidPlan(userId: string, plan: PaidMembershipPlan) {
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan, status: "inactive" },
    update: { plan, status: "inactive" },
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
  if (!url) redirect("/certificacion/pago?pago=stripe_no_configurado");
  redirect(url);
}

/** Cambia el plan de un usuario ya autenticado; devuelve la ruta destino. */
export async function resolvePlanSelectionPath(plan: MembershipPlan): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) return "/login";

  await syncStripeSubscriptionForUser(session.user.id);
  const sub = await loadSubscription(session.user.id);

  if (sub && hasCommercialAccess(sub.plan, sub.status) && sub.plan === plan) {
    return resolvePostAuthHomePath({
      email: session.user.email,
      role: session.user.role,
      plan: sub.plan,
      subscriptionStatus: sub.status,
    });
  }

  if (isTuristaPlan(plan)) {
    await ensureTuristaSubscription(session.user.id);
    return "/map";
  }

  if (isPaidMembershipPlan(plan)) {
    await ensurePendingPaidPlan(session.user.id, plan as PaidMembershipPlan);
    return "/certificacion/pago";
  }

  return "/planes";
}

/** @deprecated Usar resolvePlanSelectionPath + redirect en el caller */
export async function selectMembershipPlanForUser(plan: MembershipPlan) {
  const path = await resolvePlanSelectionPath(plan);
  redirect(path);
}

/**
 * Tras autenticación (login sin callbackUrl profundo):
 * admin → /barrid · negocio → /panel · vecino → /barrid · turista → /map
 */
export async function continueOnboardingAfterAuth(explicitPlan?: MembershipPlan | null) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pending = explicitPlan ?? (await readPendingPlanCookie());
  await clearPendingPlanCookie();

  await syncStripeSubscriptionForUser(session.user.id);
  let sub = await loadSubscription(session.user.id);

  const email = session.user.email;
  const role = session.user.role;

  if (isAdminUser({ email, role })) {
    redirect("/barrid");
  }

  if (sub && hasCommercialAccess(sub.plan, sub.status)) {
    redirect(
      resolvePostAuthHomePathAfterPayment({
        email,
        role,
        plan: sub.plan,
        subscriptionStatus: sub.status,
      })
    );
  }

  if (pending && isPaidMembershipPlan(pending)) {
    await ensurePendingPaidPlan(session.user.id, pending as PaidMembershipPlan);
    redirect("/certificacion/pago");
  }

  if (!sub || isTuristaPlan(sub.plan)) {
    await ensureTuristaSubscription(session.user.id);
    redirect("/map");
  }

  if (sub && isPaidMembershipPlan(sub.plan) && !hasCommercialAccess(sub.plan, sub.status)) {
    if (sub.status === "manual_pending") {
      redirect("/panel");
    }
    redirect("/certificacion/pago");
  }

  redirect(
    resolvePostAuthHomePath({
      email,
      role,
      plan: sub?.plan ?? "TURISTA",
      subscriptionStatus: sub?.status ?? "inactive",
    })
  );
}

export { ONBOARDING_CONTINUE_PATH };
