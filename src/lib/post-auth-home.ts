import { isAdminUser } from "@/lib/admin";
import {
  hasCommercialAccess,
  isOxxoPaymentAwaiting,
  isSoftUnpaidPlanIntent,
  isTransferPaymentPending,
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
 * Destino general (también PWA / standalone vía `/`) → /barrid
 *   (lista de pases + ficha BarrID: cuenta, mis pases, logout vía Mi cuenta, upsell Vecino)
 * Transferencia o OXXO en espera → /panel (mensaje de espera)
 * Soft unpaid (eligió plan sin checkout) → /panel (no atrapar en pago; CTAs retoman)
 * Plan de pago con checkout iniciado sin acceso → /certificacion/pago
 *
 * El flujo explícito a pago vive en select-plan / continueOnboardingAfterAuth.
 */
export function resolvePostAuthHomePath(user: PostAuthHomeUser): string {
  if (isAdminUser(user)) return "/barrid";

  const { plan, subscriptionStatus: status, paymentMethod, stripeSubscriptionId } = user;

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

  return "/barrid";
}

/** Same as home, with optional pago=exitoso for paid plan success hops. */
export function resolvePostAuthHomePathAfterPayment(user: PostAuthHomeUser): string {
  const home = resolvePostAuthHomePath(user);
  if (home === "/panel" && hasCommercialAccess(user.plan, user.subscriptionStatus)) {
    return "/panel?pago=exitoso";
  }
  if (home === "/barrid" && hasCommercialAccess(user.plan, user.subscriptionStatus)) {
    return "/barrid?pago=exitoso";
  }
  return home;
}
