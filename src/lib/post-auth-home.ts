import { isAdminUser } from "@/lib/admin";
import {
  hasCommercialAccess,
  isBusinessPlan,
  isTransferPaymentPending,
  isTuristaPlan,
  isVecinoPlan,
  needsCertificationPayment,
} from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

export type PostAuthHomeUser = {
  email?: string | null;
  role?: string | null;
  plan: MembershipPlan;
  subscriptionStatus: string;
};

/**
 * Default destination after login (or visiting /entrar while signed in).
 * Deep-link callbackUrls (sellar, beneficios, etc.) override this elsewhere.
 *
 * Admin → /barrid (panel /admin sigue en el menú)
 * Negocio activo → /panel
 * Vecino activo → /barrid
 * Turista → /map
 */
export function resolvePostAuthHomePath(user: PostAuthHomeUser): string {
  if (isAdminUser(user)) return "/barrid";

  const { plan, subscriptionStatus: status } = user;

  if (hasCommercialAccess(plan, status)) {
    if (isBusinessPlan(plan)) return "/panel";
    if (isVecinoPlan(plan)) return "/barrid";
    return "/barrid";
  }

  if (isTransferPaymentPending(status)) {
    return "/panel";
  }

  if (needsCertificationPayment(plan, status)) {
    return "/certificacion/pago";
  }

  if (isTuristaPlan(plan) || !plan) {
    return "/map";
  }

  return "/map";
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
