import type { MembershipPlan } from "@/generated/prisma/client";
import { isTuristaPlan, needsCertificationPayment } from "@/lib/membresia";

/** Enlace y etiqueta unificados para el menú de cuenta (socios de pago). */
export function getAccountNavItem(
  plan: MembershipPlan | undefined,
  status: string | undefined,
  pathname: string
): { href: string; label: string } {
  const onCertificacion = pathname.startsWith("/certificacion");
  const paidPlan = plan && !isTuristaPlan(plan);
  const pendingPayment =
    paidPlan && needsCertificationPayment(plan, status ?? "inactive");

  if (pendingPayment || onCertificacion) {
    return { href: "/certificacion/pago", label: "Mi Panel" };
  }

  return { href: "/panel", label: "Mi Panel" };
}
