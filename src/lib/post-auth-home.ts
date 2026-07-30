import { isAdminUser } from "@/lib/admin";
import {
  hasCommercialAccess,
  isOxxoPaymentAwaiting,
  isSoftUnpaidPlanIntent,
  isTransferPaymentPending,
  isTuristaPlan,
  needsCertificationPayment,
} from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

export type PostAuthHomeUser = {
  email?: string | null;
  role?: string | null;
  plan: MembershipPlan;
  subscriptionStatus: string;
  paymentMethod?: string | null;
  stripeSubscriptionId?: string | null;
};

/**
 * Default destination after login (or visiting /entrar while signed in).
 * Deep-link callbackUrls (sellar, cupones, etc.) override this elsewhere.
 *
 * Admin / socio de pago activo → /barrid
 * Transferencia o OXXO en espera → /panel (mensaje de espera)
 * Soft unpaid (eligió plan sin checkout) → /panel (no atrapar en pago; CTAs retoman)
 * Plan de pago con checkout iniciado sin acceso → /certificacion/pago
 * Turista → /mapa
 *
 * El flujo explícito a pago vive en select-plan / continueOnboardingAfterAuth.
 */
export function resolvePostAuthHomePath(user: PostAuthHomeUser): string {
  if (isAdminUser(user)) return "/barrid";

  const { plan, subscriptionStatus: status, paymentMethod, stripeSubscriptionId } = user;

  if (hasCommercialAccess(plan, status)) {
    return "/barrid";
  }

  if (isTransferPaymentPending(status) || isOxxoPaymentAwaiting(plan, status, paymentMethod)) {
    return "/panel";
  }

  if (
    isSoftUnpaidPlanIntent({
      plan,
      status,
      paymentMethod,
      stripeSubscriptionId,
    })
  ) {
    return "/panel";
  }

  if (needsCertificationPayment(plan, status, paymentMethod, stripeSubscriptionId)) {
    return "/certificacion/pago";
  }

  if (isTuristaPlan(plan) || !plan) {
    return "/mapa";
  }

  return "/mapa";
}

/** Same as home, with optional pago=exitoso for paid plan success hops. */
export function resolvePostAuthHomePathAfterPayment(user: PostAuthHomeUser): string {
  const home = resolvePostAuthHomePath(user);
  if (home === "/barrid" && hasCommercialAccess(user.plan, user.subscriptionStatus)) {
    return "/barrid?pago=exitoso";
  }
  if (home === "/panel" && hasCommercialAccess(user.plan, user.subscriptionStatus)) {
    return "/panel?pago=exitoso";
  }
  return home;
}
