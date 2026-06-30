import type { MembershipPlan } from "@/generated/prisma/client";
import { MEMBERSHIP_PLANS, PAID_PLANS } from "@/lib/membresia";

/** Siguiente plan de pago para upsell en registro. */
export function getNextPaidPlan(plan: MembershipPlan): MembershipPlan | null {
  if (plan === "GRAN_EMPRESA" || plan === "TURISTA") return null;
  const idx = PAID_PLANS.indexOf(plan as (typeof PAID_PLANS)[number]);
  if (idx < 0 || idx >= PAID_PLANS.length - 1) return null;
  return PAID_PLANS[idx + 1];
}

export function getUpgradePitch(plan: MembershipPlan): {
  nextPlan: MembershipPlan;
  label: string;
  benefits: string[];
} | null {
  const next = getNextPaidPlan(plan);
  if (!next) return null;
  const nextDef = MEMBERSHIP_PLANS[next];
  const currentIdx = PAID_PLANS.indexOf(plan as (typeof PAID_PLANS)[number]);
  const extraBenefits = nextDef.benefits.filter(
    (b) => !MEMBERSHIP_PLANS[plan].benefits.includes(b)
  );
  return {
    nextPlan: next,
    label: nextDef.label,
    benefits: (extraBenefits.length > 0 ? extraBenefits : nextDef.benefits).slice(0, 3),
  };
}
