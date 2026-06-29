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
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() &&
      (process.env.STRIPE_PRICE_ID?.trim() ||
        process.env.STRIPE_PRICE_ID_NEGOCIO_FAMILIAR?.trim())
  );
}
