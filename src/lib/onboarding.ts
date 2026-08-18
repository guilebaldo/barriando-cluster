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
  registroUrl,
} from "@/lib/plan-routing";
import { PENDING_PLAN_COOKIE } from "@/lib/pending-plan-cookie";
import type { MembershipPlan } from "@/generated/prisma/client";
import {
  hasCommercialAccess,
  isOxxoPaymentAwaiting,
  isSoftUnpaidPlanIntent,
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
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing && hasCommercialAccess(existing.plan, existing.status)) {
    console.warn("[onboarding] no degradar a TURISTA: membresía activa", {
      userId,
      plan: existing.plan,
      status: existing.status,
    });
    return;
  }
  if (existing && isPaidMembershipPlan(existing.plan) && existing.status === "manual_pending") {
    console.warn("[onboarding] no degradar a TURISTA: pago manual pendiente", userId);
    return;
  }
  if (
    existing &&
    isOxxoPaymentAwaiting(existing.plan, existing.status, existing.paymentMethod)
  ) {
    console.warn("[onboarding] no degradar a TURISTA: OXXO en espera", userId);
    return;
  }
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: "TURISTA", status: "inactive" },
    update: { plan: "TURISTA", status: "inactive", paymentMethod: null },
  });
}

/** Si eligió un plan de pago en UI pero nunca inició OXXO/tarjeta/transferencia, vuelve a Turista. */
export async function revertSoftUnpaidPlanIntentIfNeeded(userId: string) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (!existing) return null;
  if (
    !isSoftUnpaidPlanIntent({
      plan: existing.plan,
      status: existing.status,
      paymentMethod: existing.paymentMethod,
      stripeSubscriptionId: existing.stripeSubscriptionId,
    })
  ) {
    return existing;
  }
  return prisma.subscription.update({
    where: { userId },
    data: { plan: "TURISTA", status: "inactive", paymentMethod: null },
  });
}

async function revertSoftUnpaidPlanIntent(userId: string) {
  await revertSoftUnpaidPlanIntentIfNeeded(userId);
}

async function ensurePendingPaidPlan(userId: string, plan: PaidMembershipPlan) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing && hasCommercialAccess(existing.plan, existing.status)) {
    // Nunca apagar una membresía activa solo para iniciar otro checkout.
    console.warn("[onboarding] no sobrescribir membresía activa con pending", {
      userId,
      currentPlan: existing.plan,
      requestedPlan: plan,
    });
    return;
  }
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
  const result = await createStripeCheckoutUrl(userId, plan);
  if (!result.ok) redirect("/certificacion/pago?pago=stripe_no_configurado");
  redirect(result.url);
}

/** Cambia el plan de un usuario ya autenticado; devuelve la ruta destino. */
export async function resolvePlanSelectionPath(plan: MembershipPlan): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    return registroUrl(plan);
  }

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

  // Ya tiene membresía de pago activa: no degradar al elegir otro plan desde UI.
  if (sub && hasCommercialAccess(sub.plan, sub.status)) {
    return resolvePostAuthHomePath({
      email: session.user.email,
      role: session.user.role,
      plan: sub.plan,
      subscriptionStatus: sub.status,
    });
  }

  if (isTuristaPlan(plan)) {
    await ensureTuristaSubscription(session.user.id);
    return "/pases";
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
 * home móvil → /pases · pendientes de pago → /panel
 * Mi cuenta queda en el nombre de usuario → /panel
 */
export async function continueOnboardingAfterAuth(explicitPlan?: MembershipPlan | null) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Query ?plan= manda sobre cookie (evita cookie vieja de otro plan).
  const pending = explicitPlan ?? (await readPendingPlanCookie());
  await clearPendingPlanCookie();

  await syncStripeSubscriptionForUser(session.user.id);
  let sub = await loadSubscription(session.user.id);

  const email = session.user.email;
  const role = session.user.role;

  if (isAdminUser({ email, role })) {
    redirect("/pases");
  }

  if (sub && hasCommercialAccess(sub.plan, sub.status)) {
    // No degradar membresía activa si hay cookie de otro plan; ir a su espacio.
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

  if (pending && isTuristaPlan(pending)) {
    await ensureTuristaSubscription(session.user.id);
    redirect("/pases");
  }

  // Exploró paywall sin iniciar pago → vuelve a Turista (no atrapar en certificación).
  await revertSoftUnpaidPlanIntent(session.user.id);
  sub = await loadSubscription(session.user.id);

  if (!sub || isTuristaPlan(sub.plan)) {
    await ensureTuristaSubscription(session.user.id);
    redirect("/pases");
  }

  if (sub && isPaidMembershipPlan(sub.plan) && !hasCommercialAccess(sub.plan, sub.status)) {
    if (sub.status === "manual_pending" || sub.paymentMethod === "oxxo") {
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
      paymentMethod: sub?.paymentMethod,
    })
  );
}

export { ONBOARDING_CONTINUE_PATH };
