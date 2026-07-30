/** Enlace al panel de configuración (engrane / Mi cuenta → /panel). */
export function getAccountNavItem(
  _plan?: unknown,
  _status?: unknown,
  _pathname?: string
): { href: string; label: string } {
  // Siempre /panel: soft unpaid u onboarding de pago no deben secuestrar Mi cuenta.
  return { href: "/panel", label: "Mi Panel" };
}
