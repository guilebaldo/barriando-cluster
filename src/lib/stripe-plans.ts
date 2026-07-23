import type { MembershipPlan } from "@/generated/prisma/client";
import type { PaidMembershipPlan } from "@/lib/membresia";

const PRICE_ENV: Record<PaidMembershipPlan, string> = {
  VECINO: "STRIPE_PRICE_ID_VECINO",
  NEGOCIO_FAMILIAR: "STRIPE_PRICE_ID_NEGOCIO_FAMILIAR",
  MEDIANA_EMPRESA: "STRIPE_PRICE_ID_MEDIANA_EMPRESA",
  GRAN_EMPRESA: "STRIPE_PRICE_ID_GRAN_EMPRESA",
};

export function getStripePriceId(plan: PaidMembershipPlan): string | null {
  const specific = process.env[PRICE_ENV[plan]]?.trim();
  if (specific) return specific;
  // Solo fallback genérico — nunca un price_ hardcodeado de test (rompe Live).
  return process.env.STRIPE_PRICE_ID?.trim() || null;
}

export function isStripeConfiguredForPlan(plan: MembershipPlan): boolean {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) return false;
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) return false;
  if (plan === "TURISTA") return true;
  return Boolean(getStripePriceId(plan));
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  );
}

/** Mensaje legible de errores de la API de Stripe (sin filtrar en prod al usuario). */
export function formatStripeError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Error desconocido de Stripe.";
  }
  const err = error as {
    message?: string;
    type?: string;
    code?: string;
    raw?: { message?: string };
  };
  const msg = err.raw?.message || err.message;
  if (msg?.trim()) return msg.trim();
  if (err.code) return `Stripe error (${err.code}).`;
  return "Error desconocido de Stripe.";
}
