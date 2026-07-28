import { isAdminUser } from "@/lib/admin";
import {
  hasCommercialAccess,
  isOxxoPaymentAwaiting,
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
};

/**
 * Default destination after login (or visiting /entrar while signed in).
 * Deep-link callbackUrls (sellar, cupones, etc.) override this elsewhere.
 *
 * Admin / socio de pago activo → /barrid
 * Transferencia o OXXO en espera → /panel (mensaje de espera)
 * Plan de pago sin método iniciado → /certificacion/pago
 * Turista → /mapa
 */
export function resolvePostAuthHomePath(user: PostAuthHomeUser): string {
  if (isAdminUser(user)) return "/barrid";

  const { plan, subscriptionStatus: status, paymentMethod } = user;

  if (hasCommercialAccess(plan, status)) {
    return "/barrid";
  }

  if (isTransferPaymentPending(status) || isOxxoPaymentAwaiting(plan, status, paymentMethod)) {
    return "/panel";
  }

  if (needsCertificationPayment(plan, status)) {
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
